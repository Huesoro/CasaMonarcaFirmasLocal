import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex flex-col items-center justify-center space-y-8 text-center">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">Casa Monarca</h1>
          <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
            Plataforma para la gestión y documentación digital de donaciones
          </p>
        </div>

        <div className="w-full max-w-4xl">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="about">Acerca de</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Iniciar Sesión</CardTitle>
                  <CardDescription>Accede a la plataforma utilizando tu cuenta corporativa</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-center">
                    <Button asChild size="lg">
                      <Link href="/api/auth/login">Iniciar sesión con Microsoft</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="about">
              <Card>
                <CardHeader>
                  <CardTitle>Acerca de Casa Monarca</CardTitle>
                  <CardDescription>Nuestra misión y visión</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    Casa Monarca es una organización dedicada a proporcionar ayuda y recursos a quienes más lo
                    necesitan. Nuestra plataforma digital permite gestionar de manera eficiente y transparente todas las
                    donaciones recibidas y entregadas, asegurando un proceso documentado y firmado digitalmente.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
