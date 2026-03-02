import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";

export default function Settings() {
  const { data: organization } = trpc.organizations.getCurrent.useQuery();
  const { data: users } = trpc.auth.getOrganizationUsers.useQuery();
  const [editingOrg, setEditingOrg] = useState(false);

  return (
    <DashboardLayout title="Configurações" description="Gerencie sua organização e preferências">
      <div className="space-y-8 max-w-4xl">
        {/* Organization Settings */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Informações da Organização</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome</label>
              <input
                type="text"
                defaultValue={organization?.name}
                disabled={!editingOrg}
                className="w-full px-3 py-2 border border-border rounded-lg disabled:bg-muted"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Descrição</label>
              <textarea
                defaultValue={organization?.description || ""}
                disabled={!editingOrg}
                className="w-full px-3 py-2 border border-border rounded-lg disabled:bg-muted"
                rows={3}
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Indústria</label>
                <input
                  type="text"
                  defaultValue={organization?.industry || ""}
                  disabled={!editingOrg}
                  className="w-full px-3 py-2 border border-border rounded-lg disabled:bg-muted"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">País</label>
                <input
                  type="text"
                  defaultValue={organization?.country || ""}
                  disabled={!editingOrg}
                  className="w-full px-3 py-2 border border-border rounded-lg disabled:bg-muted"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {editingOrg ? (
                <>
                  <Button
                    onClick={() => {
                      setEditingOrg(false);
                      toast.success("Configurações salvas!");
                    }}
                  >
                    Salvar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setEditingOrg(false)}
                  >
                    Cancelar
                  </Button>
                </>
              ) : (
                <Button onClick={() => setEditingOrg(true)}>Editar</Button>
              )}
            </div>
          </div>
        </Card>

        {/* Subscription Info */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Assinatura</h3>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-lg font-semibold capitalize">
                  {organization?.subscription?.status || "Sem assinatura"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Mensal</p>
                <p className="text-lg font-semibold">
                  R$ {organization?.subscription?.monthlyAmount || "0,00"}
                </p>
              </div>
            </div>
            {organization?.subscription?.trialEndsAt && (
              <div>
                <p className="text-sm text-muted-foreground">Trial Termina em</p>
                <p className="text-lg font-semibold">
                  {new Date(organization.subscription.trialEndsAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
            )}
            <Button>Gerenciar Assinatura</Button>
          </div>
        </Card>

        {/* Modules */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Módulos Ativos</h3>
          <div className="space-y-3">
            {organization && 'modules' in organization && (organization.modules as any[])?.length > 0 ? (
              (organization.modules as any[]).map((module: any) => (
                <div
                  key={module.id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{module.name}</p>
                    <p className="text-sm text-muted-foreground">
                      R$ {parseFloat(module.monthlyPrice as any).toFixed(2)}/mês
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Gerenciar
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">Nenhum módulo ativo</p>
            )}
          </div>
          <Button className="mt-4">Adicionar Módulo</Button>
        </Card>

        {/* Team Members */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Membros da Equipe</h3>
          <div className="space-y-3">
            {users && users.length > 0 ? (
              users.map((user: any) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium capitalize bg-primary/10 px-2 py-1 rounded">
                      {user.role}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">Nenhum membro</p>
            )}
          </div>
          <Button className="mt-4">Convidar Membro</Button>
        </Card>

        {/* Danger Zone */}
        <Card className="p-6 border-red-200 bg-red-50/50">
          <h3 className="text-lg font-semibold mb-4 text-red-600">Zona de Perigo</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Estas ações não podem ser desfeitas. Por favor, proceda com cuidado.
          </p>
          <Button variant="destructive">Deletar Organização</Button>
        </Card>
      </div>
    </DashboardLayout>
  );
}
