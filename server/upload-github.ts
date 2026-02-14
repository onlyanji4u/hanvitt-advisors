
import { getUncachableGitHubClient } from './github';
import fs from 'fs';
import path from 'path';

async function uploadToGitHub() {
  const owner = 'onlyanji4u';
  const repo = 'hanvitt-advisors';
  
  try {
    const octokit = await getUncachableGitHubClient();
    
    // Create repo if it doesn't exist
    try {
      await octokit.repos.get({ owner, repo });
      console.log(`Repository ${owner}/${repo} already exists.`);
    } catch (e) {
      console.log(`Creating repository ${owner}/${repo}...`);
      await octokit.repos.createForAuthenticatedUser({
        name: repo,
        private: false,
        description: 'Hanvitt Advisors Website'
      });
    }

    const filesToUpload = [
      'package.json',
      'tsconfig.json',
      'vite.config.ts',
      'tailwind.config.ts',
      'replit.md',
      'shared/schema.ts',
      'shared/routes.ts',
      'server/index.ts',
      'server/routes.ts',
      'server/storage.ts',
      'server/vite.ts',
      'client/index.html',
      'client/src/main.tsx',
      'client/src/App.tsx',
      'client/src/index.css',
    ];

    // Basic recursive file finder for source directories
    function getFiles(dir: string, fileList: string[] = []) {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
          if (!['node_modules', 'dist', '.git', '.cache'].includes(file)) {
            getFiles(filePath, fileList);
          }
        } else {
          fileList.push(filePath);
        }
      });
      return fileList;
    }

    const allFiles = [...filesToUpload, ...getFiles('client/src'), ...getFiles('server'), ...getFiles('shared')];
    const uniqueFiles = [...new Set(allFiles)].filter(f => fs.existsSync(f) && !fs.statSync(f).isDirectory());

    console.log(`Uploading ${uniqueFiles.length} files...`);

    for (const file of uniqueFiles) {
      const content = fs.readFileSync(file, 'base64');
      const message = `Upload ${file}`;
      const pathOnGit = file.replace(/\\/g, '/');

      try {
        // Check if file exists to get SHA
        let sha;
        try {
          const { data } = await octokit.repos.getContent({ owner, repo, path: pathOnGit });
          if (!Array.isArray(data)) sha = data.sha;
        } catch (e) {}

        await octokit.repos.createOrUpdateFileContents({
          owner,
          repo,
          path: pathOnGit,
          message,
          content,
          sha
        });
        console.log(`✓ Uploaded ${pathOnGit}`);
      } catch (err: any) {
        console.error(`✗ Failed to upload ${pathOnGit}: ${err.message}`);
      }
    }
    
    console.log('GitHub upload completed successfully!');
  } catch (err: any) {
    console.error('Error during GitHub upload:', err.message);
    process.exit(1);
  }
}

uploadToGitHub();
