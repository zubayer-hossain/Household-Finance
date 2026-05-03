import { useQuery } from "@tanstack/react-query";

import { qk } from "@/lib/query-keys";
import { profileService } from "@/features/auth/services/profile.service";

export function useProfileQuery(enabled = true) {
  return useQuery({
    queryKey: qk.profile,
    queryFn: () => profileService.getMyProfile(),
    enabled,
    staleTime: 60_000,
  });
}
