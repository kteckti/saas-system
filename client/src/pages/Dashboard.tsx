import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { BarChart3, TrendingUp, Users, Package } from "lucide-react";

export default function Dashboard() {
  const { data: organization } = trpc.organizations.getCurrent.useQuery();

  const kpis = [
    {
      title: "Receita Total",
      value: "R$ 0,00",
      change: "+0%",
      icon: TrendingUp,
      color: "text-green-600",
    },
    {
      title: "Leads Ativos",
      value: "0",
      change: "Este mês",
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Produtos",
      value: "0",
      change: "Em estoque",
      icon: Package,
      color: "text-purple-600",
    },
    {
      title: "Contas a Receber",
      value: "R$ 0,00",
      change: "Pendente",
      icon: BarChart3,
      color: "text-orange-600",
    },
  ];

  return (
    <DashboardLayout
      title="Dashboard"
      description="Bem-vindo ao SmartOps - Sua plataforma de operações inteligentes"
    >
      <div className="space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Card key={kpi.title} className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {kpi.title}
                    </p>
                    <p className="text-2xl font-bold mt-2">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {kpi.change}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg bg-accent ${kpi.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Welcome Section */}
        <Card className="p-8 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <h2 className="text-2xl font-bold mb-2">
            Bem-vindo ao SmartOps, {organization?.name}!
          </h2>
          <p className="text-muted-foreground mb-6">
            Você está usando a plataforma de operações inteligentes mais completa do mercado.
            Aqui você pode gerenciar todos os aspectos do seu negócio em um único lugar.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-background rounded-lg border border-border">
              <h3 className="font-semibold mb-2">🚀 Próximos Passos</h3>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>✓ Configure sua organização</li>
                <li>✓ Ative os módulos que precisa</li>
                <li>✓ Convide seus colegas</li>
                <li>✓ Comece a usar!</li>
              </ul>
            </div>
            <div className="p-4 bg-background rounded-lg border border-border">
              <h3 className="font-semibold mb-2">📚 Recursos Úteis</h3>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>📖 Documentação completa</li>
                <li>🎓 Tutoriais em vídeo</li>
                <li>💬 Suporte por chat</li>
                <li>📧 Contato direto</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Modules Overview */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Módulos Ativos</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {organization && 'modules' in organization && (organization.modules as any[])?.map((module: any) => (
              <Card
                key={module.id}
                className="p-4 hover:border-primary/50 transition-colors cursor-pointer"
              >
                <h4 className="font-semibold">{module.name}</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {module.description}
                </p>
                <p className="text-sm font-medium text-primary mt-3">
                  R$ {parseFloat(module.monthlyPrice as any).toFixed(2)}/mês
                </p>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Estatísticas Rápidas</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Usuários Ativos</p>
              <p className="text-3xl font-bold mt-2">1</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Módulos Ativos</p>
              <p className="text-3xl font-bold mt-2">
                {organization && 'modules' in organization ? (organization.modules as any[])?.length || 0 : 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status da Assinatura</p>
              <p className="text-3xl font-bold mt-2">
                {organization?.subscription?.status === "trial"
                  ? "Trial"
                  : "Ativo"}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
