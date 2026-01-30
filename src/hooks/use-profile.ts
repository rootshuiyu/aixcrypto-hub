"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useProfile(userId: string) {
  const q = useQuery({
    queryKey: ["userProfile", userId],
    queryFn: () => api.getUserProfile(userId),
    enabled: !!userId,
    staleTime: 5_000, // 缩短缓存时间，确保余额更新更及时
  });

  return {
    profile: q.data,
    isLoading: q.isLoading,
    error: q.error,
    refetch: q.refetch,
  };
}









