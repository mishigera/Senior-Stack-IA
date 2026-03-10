import { useState } from "react";
import { useUsers } from "@/hooks/use-users";
import { useRoles, useAssignRole } from "@/hooks/use-roles";
import { SectionTitle, SectionDescription, Card, PrimaryButton } from "@/components/ui-wrappers";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, UserPlus, Shield } from "lucide-react";

export default function UsersPage() {
  const { data: users, isLoading } = useUsers();
  const { data: roles } = useRoles();
  const assignRoleMutation = useAssignRole();

  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");

  const handleAssignRole = () => {
    if (selectedUser && selectedRole) {
      assignRoleMutation.mutate({ userId: selectedUser, roleId: parseInt(selectedRole) }, {
        onSuccess: () => {
          setSelectedUser(null);
          setSelectedRole("");
        }
      });
    }
  };

  if (isLoading) {
    return <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <SectionTitle>User Management</SectionTitle>
          <SectionDescription>View and manage access for all users in the system.</SectionDescription>
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Joined</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users?.map((user) => (
                <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4">
                    {(() => {
                      const username = (user as typeof user & { username?: string | null }).username;

                      return (
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.profileImageUrl || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {(username || user.email)?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-foreground">
                        {username || 'No Name'}
                      </span>
                    </div>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{user.email}</td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {user.createdAt ? format(new Date(user.createdAt), "MMM d, yyyy") : 'Unknown'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedUser(user.id)}
                      className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Assign Role
                    </button>
                  </td>
                </tr>
              ))}
              {!users?.length && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center">
                      <UserPlus className="h-12 w-12 mb-4 text-muted-foreground/50" />
                      <p>No users found in the system.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Assign Role</DialogTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Select a role to grant specific permissions to this user.
            </p>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="rounded-xl h-12">
                <SelectValue placeholder="Select a role..." />
              </SelectTrigger>
              <SelectContent>
                {roles?.map((role) => (
                  <SelectItem key={role.id} value={role.id.toString()}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <button 
              onClick={() => setSelectedUser(null)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <PrimaryButton 
              onClick={handleAssignRole} 
              disabled={!selectedRole || assignRoleMutation.isPending}
              className="rounded-xl"
            >
              {assignRoleMutation.isPending ? "Assigning..." : "Assign Role"}
            </PrimaryButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
