import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { ArrowRight, CheckCircle, Zap, Users, BarChart3, Lock } from "lucide-react";
import { useEffect } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (user && !loading) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-background/50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/50">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SO</span>
            </div>
            <span className="font-bold text-lg">SmartOps</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => navigate("/login")}
            >
              Login com Email
            </Button>
            <Button
              onClick={() => (window.location.href = getLoginUrl())}
              variant="default"
            >
              Entrar com OAuth
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Operações Inteligentes para
              <span className="block bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Seu Negócio Crescer
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Gerencie Financeiro, CRM, Estoque e muito mais em uma única plataforma. Escolha apenas os módulos que precisa e pague apenas pelo que usa.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate("/login")}
              className="shadow-lg hover:shadow-xl transition-all"
            >
              Começar Agora <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => (window.location.href = getLoginUrl())}
            >
              Entrar com OAuth
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            ✨ 14 dias de trial gratuito. Sem cartão de crédito necessário.
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Tudo que você precisa para gerenciar seu negócio
          </h2>
          <p className="text-lg text-muted-foreground">
            Módulos poderosos e integrados para diferentes áreas da sua empresa
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Dashboard Module */}
          <div className="group p-6 rounded-xl border border-border hover:border-primary/50 hover:bg-card/50 transition-all">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Dashboard</h3>
            <p className="text-sm text-muted-foreground">
              Visão geral em tempo real com KPIs dinâmicos e widgets customizáveis
            </p>
          </div>

          {/* Financial Module */}
          <div className="group p-6 rounded-xl border border-border hover:border-primary/50 hover:bg-card/50 transition-all">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <svg
                className="w-6 h-6 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">Financeiro</h3>
            <p className="text-sm text-muted-foreground">
              Fluxo de caixa, contas a pagar/receber e categorias de despesas
            </p>
          </div>

          {/* CRM Module */}
          <div className="group p-6 rounded-xl border border-border hover:border-primary/50 hover:bg-card/50 transition-all">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">CRM</h3>
            <p className="text-sm text-muted-foreground">
              Gestão de leads, pipeline de vendas e histórico de interações
            </p>
          </div>

          {/* Inventory Module */}
          <div className="group p-6 rounded-xl border border-border hover:border-primary/50 hover:bg-card/50 transition-all">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <svg
                className="w-6 h-6 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m0 0l8 4m-8-4v10l8 4m0-10l8 4m-8-4v10M8 5v10m8-10v10"
                />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">Estoque</h3>
            <p className="text-sm text-muted-foreground">
              Controle de produtos, fornecedores e alertas de estoque baixo
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">
              Por que escolher SmartOps?
            </h2>
            <div className="space-y-4">
              <div className="flex gap-3">
                <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Pay-per-module</h3>
                  <p className="text-sm text-muted-foreground">
                    Pague apenas pelos módulos que você usa. Adicione novos conforme cresce.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Multi-tenant</h3>
                  <p className="text-sm text-muted-foreground">
                    Gerencie múltiplas organizações em uma única conta com isolamento completo.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Integrado</h3>
                  <p className="text-sm text-muted-foreground">
                    Todos os módulos trabalham juntos para uma visão completa do seu negócio.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Seguro</h3>
                  <p className="text-sm text-muted-foreground">
                    Dados criptografados e isolados por tenant com RBAC avançado.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl p-8 border border-border">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Zap className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Tempo de setup</p>
                  <p className="text-lg font-semibold">Menos de 5 minutos</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Lock className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Segurança</p>
                  <p className="text-lg font-semibold">Enterprise-grade</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Preços Transparentes
          </h2>
          <p className="text-lg text-muted-foreground">
            Escolha os módulos que precisa. Sem surpresas.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { name: "Dashboard", price: "Grátis" },
            { name: "Financeiro", price: "R$ 99/mês" },
            { name: "CRM", price: "R$ 149/mês" },
            { name: "Estoque", price: "R$ 129/mês" },
          ].map((module) => (
            <div
              key={module.name}
              className="p-6 rounded-xl border border-border hover:border-primary/50 transition-all"
            >
              <h3 className="font-semibold mb-2">{module.name}</h3>
              <p className="text-2xl font-bold text-primary">{module.price}</p>
              <p className="text-xs text-muted-foreground mt-2">por mês</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-6">
            Comece com 14 dias de trial gratuito. Sem cartão de crédito.
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/login")}
            className="shadow-lg hover:shadow-xl transition-all"
          >
            Começar Agora <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl border border-primary/20 p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Pronto para transformar seu negócio?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Junte-se a centenas de empresas que já estão usando SmartOps para gerenciar suas operações.
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/login")}
            className="shadow-lg hover:shadow-xl transition-all"
          >
            Comece Seu Trial Gratuito <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SO</span>
              </div>
              <span className="font-bold">SmartOps</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 SmartOps. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
