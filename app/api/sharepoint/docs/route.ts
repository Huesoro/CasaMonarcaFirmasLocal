import fs from "fs"
import path from "path"
import { NextResponse } from "next/server"

export async function GET() {
  // Ruta relativa desde la raíz del proyecto
  const dirPath = path.join(process.cwd(), "SharePoint", "Historial")

  try {
    const files = fs.readdirSync(dirPath)
    const fileList = files.map((filename) => ({
      name: filename,
      url: `/api/sharepoint/download?file=${encodeURIComponent(filename)}`,
    }))
    return NextResponse.json(fileList)
  } catch (error) {
    console.error("Error leyendo la carpeta de firmas:", error)
    return NextResponse.json({ error: "No se pudieron leer los archivos" }, { status: 500 })
  }
}
