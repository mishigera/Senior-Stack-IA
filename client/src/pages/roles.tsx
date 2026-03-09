import { useState } from "react";
import { useRoles, useCreateRole } from "@/hooks/use-roles";
import { SectionTitle, SectionDescription, Card, PrimaryButton } from "@/components/ui-wrappers";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus, ShieldAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function RolesPage() {
  const { data: roles, isLoading } = useRoles();
  const createRoleMutation = useCreateRole();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "" });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createRoleMutation.mutate(formData, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setFormData({ name: "", description: "" });
      }
    });
  };

  if (isLoading) {
    return <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <SectionTitle>Roles & Permissions</SectionTitle>
          <SectionDescription>Define system roles and their descriptive boundaries.</SectionDescription>
        </div>
        <PrimaryButton onClick={() => setIsDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Create Role
        </PrimaryButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles?.map((role) => (
          <Card key={role.id} className="flex flex-col h-full border-primary/10 hover:border-primary/30 group">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                ID: {role.id}
              </span>
            </div>
            <h3 className="text-xl font-bold font-display text-foreground mb-2">{role.name}</h3>
            <p className="text-sm text-muted-foreground flex-1">
              {role.description || "No description provided."}
            </p>
          </Card>
        ))}

        {!roles?.length && (
          <div className="col-span-full py-12 text-center text-muted-foreground bg-card rounded-2xl border border-dashed">
            No roles defined yet. Create one to get started.
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Create New Role</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Role Name</Label>
              <Input 
                id="name" 
                value={formData.name}
                onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g., Administrator"
                className="rounded-xl"
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                value={formData.description}
                onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                placeholder="Brief description of responsibilities..."
                className="rounded-xl resize-none"
                rows={3}
              />
            </div>
            <DialogFooter className="pt-4">
              <button 
                type="button"
                onClick={() => setIsDialogOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <PrimaryButton 
                type="submit" 
                disabled={!formData.name || createRoleMutation.isPending}
                className="rounded-xl"
              >
                {createRoleMutation.isPending ? "Creating..." : "Create Role"}
              </PrimaryButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
