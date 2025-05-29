import fs from "fs"
import path from "path"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const fileName = request.nextUrl.searchParams.get("file")
  const filePath = path.join(process.cwd(), "SharePoint", "Historial", fileName || "")

  try {
    const fileBuffer = fs.readFileSync(filePath)
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Disposition": `inline; filename="${fileName}"`,
        "Content-Type": "application/pdf", // o detecta MIME con mime-types
      },
    })
  } catch (error) {
    console.error("Error descargando archivo:", error)
    return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 })
  }
}
