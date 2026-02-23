import { useQuery } from "@tanstack/react-query";

export function useSiteSettings() {
  const { data: settings, isLoading } = useQuery<Record<string, string>>({
    queryKey: ['/api/public/settings'],
    staleTime: 30000,
  });

  return {
    caTaxEnabled: settings?.ca_tax_enabled !== "false",
    isLoading,
    settings: settings || {},
  };
}
