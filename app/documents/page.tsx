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

interface Documento {
  doc_id: number
  title: string
  sharepoint_url: string
  Type: string
  status: string
  user_id: number
  created_at: string
  updated_at: string
  firma_status: string
  fecha_firma: string | null
  creador_nombre: string
}

export default function Documents() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("pending")
  const [selectedDocument, setSelectedDocument] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSigning, setIsSigning] = useState(false)
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [firmas, setFirmas] = useState<any[]>([])
  const [loadingFirmas, setLoadingFirmas] = useState(false)
  const [docContent, setDocContent] = useState<string>('');
  const [isLoadingDoc, setIsLoadingDoc] = useState(false);
  const [orden, setOrden] = useState("fecha")

  const fetchDocuments = async (tab = activeTab) => {
    setLoading(true)
    try {
      let docs: any[] = []
      if (user) {
        const res = await fetch(`http://localhost:8000/api/documentos/pendientes?user_id=${user.user_id}&rol=${user.role}`)
        const data = await res.json()
        docs = data.documentos || []

        if (tab === "pending") {
          docs = docs.filter(doc => doc.firma_status === "pendiente")
        } else if (tab === "signed") {
          docs = docs.filter(doc => doc.firma_status === "firmado")
        } else if (tab === "rejected") {
          docs = docs.filter(doc => doc.firma_status === "rechazado")
        }

        // Aquí podrías hacer más lógica según rol en pestaña "all"
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

  useEffect(() => {
    if (user?.role === "admin" && selectedDocument) {
      setLoadingFirmas(true)
      fetch(`http://localhost:8000/api/documentos/firmas/${selectedDocument.doc_id}`)
        .then(res => res.json())
        .then(data => setFirmas(data.firmas || []))
        .finally(() => setLoadingFirmas(false))
    } else {
      setFirmas([])
    }
  }, [selectedDocument, user])

  useEffect(() => {
    if (selectedDocument) {
      setIsLoadingDoc(true);
      loadDocumentContent(selectedDocument)
        .finally(() => setIsLoadingDoc(false));
    }
  }, [selectedDocument]);

  const handleSignDocument = async (doc: any) => {
    const password = prompt("Introduce tu contrase\u00f1a de firma:")
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
        }),
      })
      const data = await res.json()
      if (data.status === "success") {
        toast({ title: "Documento firmado", description: "El documento ha sido firmado exitosamente." })
        setIsDialogOpen(false)
        fetchDocuments(activeTab)
      } else {
        toast({ title: "Error", description: data.message || "No se pudo firmar el documento.", variant: "destructive" })
      }
    } catch (err) {
      toast({ title: "Error", description: "Error de red al firmar el documento.", variant: "destructive" })
    } finally {
      setIsSigning(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "firmado": return <CheckCircle className="h-5 w-5 text-green-500" />
      case "pendiente": return <Clock className="h-5 w-5 text-amber-500" />
      case "rechazado": return <AlertCircle className="h-5 w-5 text-red-500" />
      default: return null
    }
  }

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case "firmado": return "Firmado"
      case "pendiente": return "Pendiente"
      case "rechazado": return "Rechazado"
      default: return status
    }
  }

  const loadDocumentContent = async (doc: any) => {
    try {
      const documentId = doc.doc_id || doc.id;
      const fileType = doc.sharepoint_url.toLowerCase().split('.').pop();
      const useFirmado = doc.firma_status === "firmado" && fileType === "docx";
      const url = `http://localhost:8000/api/documents/download/${documentId}${useFirmado ? '?firmado=true' : ''}`;
      const response = await fetch(url);
      const blob = await response.blob();

      if (fileType === 'pdf') {
        const url = URL.createObjectURL(blob);
        setDocContent(url);
      } else if (fileType === 'docx') {
        const arrayBuffer = await blob.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        setDocContent(result.value);
      } else {
        setDocContent("No se puede previsualizar este tipo de archivo.");
      }
    } catch (error) {
      console.error(error);
      setDocContent("Error al cargar el documento.");
    }
  }

  const sortedDocuments = [...documents].sort((a, b) => {
    if (orden === "fecha") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    } else {
      return a.title.localeCompare(b.title)
    }
  })

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Documentos</h1>
        <p className="text-muted-foreground">Gestiona los documentos que requieren tu firma</p>
      </div>

      <div className="mb-4 flex items-center gap-4">
        <label htmlFor="orden" className="text-sm font-medium">Ordenar por:</label>
        <select
          id="orden"
          className="border rounded px-2 py-1"
          value={orden}
          onChange={(e) => setOrden(e.target.value)}
        >
          <option value="fecha">Fecha</option>
          <option value="alfabetico">Nombre</option>
        </select>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="pending">Pendientes</TabsTrigger>
          <TabsTrigger value="signed">Firmados</TabsTrigger>
          <TabsTrigger value="rejected">Rechazados</TabsTrigger>
          <TabsTrigger value="all">Todos</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {loading ? (
            <div className="text-center py-10">Cargando documentos...</div>
          ) : sortedDocuments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-center text-muted-foreground">
                  No hay documentos {activeTab !== "all" ? getStatusText(activeTab) + "s" : ""} para mostrar
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sortedDocuments.map((doc) => (
                <Card key={doc.doc_id ?? doc.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg font-medium">{doc.title}</CardTitle>
                      <div>{getStatusIcon(doc.firma_status || doc.status)}</div>
                    </div>
                    <CardDescription>Creado por: {doc.creador_nombre}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>
                        Fecha: {new Date(doc.created_at ?? doc.date).toLocaleDateString()}
                      </span>
                      <span className="capitalize">Tipo: {doc.Type === "dinero" ? "Dinero" : "Insumos"}</span>
                    </div>
                    {doc.fecha_firma && (
                      <div className="text-sm text-muted-foreground mt-2">
                        Firmado el: {new Date(doc.fecha_firma).toLocaleString()}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between pt-0">
                    <Button variant="outline" size="sm" onClick={() => { setSelectedDocument(doc); setIsDialogOpen(true); }}>
                      Ver documento
                    </Button>
                    {doc.firma_status === "pendiente" && (
                      <Button size="sm" onClick={() => { setSelectedDocument(doc); setIsDialogOpen(true); }}>
                        Firmar
                      </Button>
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


