"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FileText, Download, CheckCircle, Clock, AlertCircle } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import mammoth from 'mammoth';

export default function Documents() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("pending")
  const [selectedDocument, setSelectedDocument] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSigning, setIsSigning] = useState(false)
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [docContent, setDocContent] = useState<string>('')
  const [isLoadingDoc, setIsLoadingDoc] = useState(false)

  const fetchDocuments = async (tab = activeTab) => {
    setLoading(true)
    try {
      let docs = []
      if (user) {
        const res = await fetch(`http://localhost:8000/api/documentos/pendientes?user_id=${user.user_id}&rol=${user.role}`)
        const data = await res.json()
        docs = data.documentos || []

        if (tab === "pending") {
          docs = docs.filter(doc => doc.firma_status === "pendiente")
        }

        docs = docs.map(doc => ({
          ...doc,
          title: `Donación ${doc.Type === "dinero" ? "dinero" : "especie"} - ${doc.nombre_donante || "Donante desconocido"}`
        }))
      }
      setDocuments(docs)
    } catch (error) {
      console.error("Error fetching documents:", error)
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments(activeTab)
  }, [activeTab, user])

  const handleSignDocument = async (doc: any) => {
    const password = prompt("Introduce tu contraseña de firma:")
    if (!password) return
    setIsSigning(true)
    try {
      const res = await fetch("http://localhost:8000/api/documentos/firmar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doc_id: doc.doc_id,
          user_id: user.user_id,
          rol: user.role,
          password_firma: password,
        })
      })
      const data = await res.json()
      if (data.status === "success") {
        toast({ title: "Documento firmado", description: "El documento ha sido firmado exitosamente." })
        setIsDialogOpen(false)
        fetchDocuments(activeTab)
      } else {
        toast({ title: "Error", description: data.message || "No se pudo firmar el documento.", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Error de red al firmar el documento.", variant: "destructive" })
    } finally {
      setIsSigning(false)
    }
  }

  const loadDocumentContent = async (doc: any) => {
    try {
      const documentId = doc.doc_id || doc.id
      const fileType = doc.sharepoint_url.toLowerCase().split('.').pop()
      const useFirmado = doc.firma_status === "firmado" && fileType === "docx"
      const url = `http://localhost:8000/api/documents/download/${documentId}${useFirmado ? '?firmado=true' : ''}`

      const response = await fetch(url)
      const blob = await response.blob()

      if (fileType === 'pdf') {
        const url = URL.createObjectURL(blob)
        setDocContent(url)
      } else if (fileType === 'docx') {
        const arrayBuffer = await blob.arrayBuffer()
        const result = await mammoth.convertToHtml({ arrayBuffer })
        setDocContent(result.value)
      } else {
        setDocContent(`<p>No se puede previsualizar este tipo de archivo.</p>`)
      }
    } catch (error) {
      setDocContent(`<p>Error al cargar el documento.</p>`)
    }
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <Tabs defaultValue="pending" onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="pending">Pendientes</TabsTrigger>
          <TabsTrigger value="signed">Firmados</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab}>
          {loading ? (
            <div>Cargando...</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {documents.map(doc => (
                <Card key={doc.doc_id}>
                  <CardHeader>
                    <CardTitle>{doc.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>Creado por: {doc.creador_nombre}</p>
                    <p>Fecha: {new Date(doc.created_at).toLocaleDateString()}</p>
                    <p>Tipo: {doc.Type === "dinero" ? "Dinero" : "Insumos"}</p>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={() => { setSelectedDocument(doc); setIsDialogOpen(true) }}>Ver documento</Button>
                    {doc.firma_status === "pendiente" && (
                      <Button onClick={() => handleSignDocument(doc)}>Firmar</Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

