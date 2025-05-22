export default function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Casa Monarca. Todos los derechos reservados.
          </p>
          <p className="text-center text-sm text-muted-foreground">Plataforma para gestión de donaciones y procesos</p>
        </div>
      </div>
    </footer>
  )
}
