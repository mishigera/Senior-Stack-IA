import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { Role, InsertRole } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useRoles() {
  return useQuery<Role[]>({
    queryKey: [api.roles.list.path],
    queryFn: async () => {
      const res = await fetch(api.roles.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch roles");
      return res.json();
    },
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertRole) => {
      const res = await fetch(api.roles.create.path, {
        method: api.roles.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create role");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.roles.list.path] });
      toast({ title: "Success", description: "Role created successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useAssignRole() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: number }) => {
      const url = buildUrl(api.roles.assign.path, { userId });
      const res = await fetch(url, {
        method: api.roles.assign.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId }),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to assign role");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Role assigned to user successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}
