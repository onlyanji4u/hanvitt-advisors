import { Octokit } from '@octokit/rest';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? 'depl ' + process.env.WEB_REPL_RENEWAL
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

function getTrackedFiles(): string[] {
  const output = execSync('git ls-files', { encoding: 'utf8', cwd: '/home/runner/workspace' });
  return output.trim().split('\n').filter(f => f.length > 0);
}

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const SKIP_FILES = new Set(['project.zip', 'package-lock.json']);
const SKIP_PATTERNS = [/^node_modules\//, /^\.cache\//, /^scripts\/push-to-github/];

function shouldSkip(file: string, fullPath: string): boolean {
  if (SKIP_FILES.has(file)) return true;
  if (SKIP_PATTERNS.some(p => p.test(file))) return true;
  try {
    const stat = fs.statSync(fullPath);
    if (stat.size > MAX_FILE_SIZE) return true;
  } catch { return true; }
  return false;
}

function isBinaryFile(filePath: string): boolean {
  const binaryExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.mp4', '.webm', '.mp3', '.wav', '.pdf', '.zip', '.tar', '.gz'];
  return binaryExtensions.includes(path.extname(filePath).toLowerCase());
}

async function main() {
  const accessToken = await getAccessToken();
  const octokit = new Octokit({ auth: accessToken });

  const { data: user } = await octokit.users.getAuthenticated();
  console.log(`Authenticated as: ${user.login}`);

  const repoName = 'hanvitt-advisors';
  const owner = user.login;

  try {
    await octokit.repos.get({ owner, repo: repoName });
    console.log(`Repository ${owner}/${repoName} already exists.`);
  } catch (e: any) {
    if (e.status === 404) {
      console.log(`Creating repository ${repoName}...`);
      await octokit.repos.createForAuthenticatedUser({
        name: repoName,
        description: 'Hanvitt Advisors - Professional Financial Advisory Website',
        private: true,
        auto_init: false,
      });
      console.log(`Repository created.`);
    } else {
      throw e;
    }
  }

  console.log('Collecting files...');
  const allFiles = getTrackedFiles();
  const files: string[] = [];
  const skipped: string[] = [];

  for (const file of allFiles) {
    const fullPath = path.join('/home/runner/workspace', file);
    if (shouldSkip(file, fullPath)) {
      skipped.push(file);
    } else {
      files.push(file);
    }
  }

  console.log(`Will upload ${files.length} files (skipping ${skipped.length} large/excluded files).`);
  if (skipped.length > 0) {
    console.log(`Skipped: ${skipped.slice(0, 5).join(', ')}${skipped.length > 5 ? '...' : ''}`);
  }

  console.log('Uploading blobs...');
  const treeItems: any[] = [];
  let count = 0;

  for (const file of files) {
    const fullPath = path.join('/home/runner/workspace', file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) continue;

    count++;
    if (count % 20 === 0) {
      console.log(`  ${count}/${files.length}...`);
    }

    let blobSha: string;
    if (isBinaryFile(file)) {
      const content = fs.readFileSync(fullPath);
      const { data: blob } = await octokit.git.createBlob({
        owner,
        repo: repoName,
        content: content.toString('base64'),
        encoding: 'base64',
      });
      blobSha = blob.sha;
    } else {
      const content = fs.readFileSync(fullPath, 'utf8');
      const { data: blob } = await octokit.git.createBlob({
        owner,
        repo: repoName,
        content,
        encoding: 'utf-8',
      });
      blobSha = blob.sha;
    }

    treeItems.push({
      path: file,
      mode: '100644' as const,
      type: 'blob' as const,
      sha: blobSha,
    });
  }

  console.log(`Uploaded ${treeItems.length} blobs. Creating tree...`);

  const { data: tree } = await octokit.git.createTree({
    owner,
    repo: repoName,
    tree: treeItems,
  });

  const commitMessage = 'v3.0 - Retirement planner, input UX improvements, DB cleanup';

  let parentSha: string | undefined;
  try {
    const { data: ref } = await octokit.git.getRef({ owner, repo: repoName, ref: 'heads/main' });
    parentSha = ref.object.sha;
  } catch {}

  const commitParams: any = {
    owner,
    repo: repoName,
    message: commitMessage,
    tree: tree.sha,
  };
  if (parentSha) {
    commitParams.parents = [parentSha];
  }

  const { data: commit } = await octokit.git.createCommit(commitParams);

  try {
    await octokit.git.updateRef({
      owner,
      repo: repoName,
      ref: 'heads/main',
      sha: commit.sha,
      force: true,
    });
  } catch {
    await octokit.git.createRef({
      owner,
      repo: repoName,
      ref: 'refs/heads/main',
      sha: commit.sha,
    });
  }

  console.log(`\nDone! Code pushed to: https://github.com/${owner}/${repoName}`);
  console.log(`Commit: ${commit.sha.substring(0, 7)} - ${commitMessage}`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
