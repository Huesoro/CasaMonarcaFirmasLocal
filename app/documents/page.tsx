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

interface User {
  id: string;
  user_id: string;
  role: string;
  name?: string;
  email?: string;
  // ... otros campos que pueda tener el usuario
}

interface Document {
  doc_id: string;
  title: string;
  sharepoint_url: string;
  type: string;
  status: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  firma_status: string;
}

// Define el tipo de documento según la base de datos
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

  // Cargar documentos según la pestaña
  const fetchDocuments = async (tab = activeTab) => {
    setLoading(true)
    try {
      let docs = []
      if (user) {
        const res = await fetch(`http://localhost:8000/api/documentos/pendientes?user_id=${user.user_id}&rol=${user.role}`)
        const data = await res.json()
        docs = data.documentos || []
        
        // Filtrar documentos según la pestaña activa
        if (tab === "pending") {
          docs = docs.filter(doc => doc.firma_status === "pendiente")
        } else if (tab === "signed") {
          docs = docs.filter(doc => doc.firma_status === "firmado")
        } else if (tab === "rejected") {
          docs = docs.filter(doc => doc.firma_status === "rechazado")
        } else if (tab === "all") {
          // Para la pestaña "Todos", comportamiento según rol
          if (user.role === "reception") {
            // Recepción solo ve sus propios documentos
            docs = docs.filter(doc => doc.user_id === user.user_id)
          } else if (user.role === "finance") {
            // Finanzas ve todos los documentos de tipo dinero
            const resHistorial = await fetch("http://localhost:8000/api/historial-donaciones")
            const dataHistorial = await resHistorial.json()
            docs = (dataHistorial.donaciones || [])
              .filter(doc => doc.type === "money")
              .map(doc => ({
                ...doc,
                doc_id: doc.id.replace('don-', ''),
                firma_status: doc.status,
                Type: "dinero",
                status: doc.status,
                title: `Donación ${doc.Type === "dinero" ? "dinero" : "especie"} - ${doc.nombre_donante || "Donante desconocido"}`
              }))
          } else if (user.role === "inventory") {
            // Inventario ve todos los documentos de tipo insumos
            const resHistorial = await fetch("http://localhost:8000/api/historial-donaciones")
            const dataHistorial = await resHistorial.json()
            docs = (dataHistorial.donaciones || [])
              .filter(doc => doc.type === "supplies")
              .map(doc => ({
                ...doc,
                doc_id: doc.id.replace('don-', ''),
                firma_status: doc.status,
                title: `Donación ${doc.Type === "dinero" ? "dinero" : "especie"} - ${doc.nombre_donante || "Donante desconocido"}`
              }))
          } else if (user.role === "admin") {
            // Admin ve todos los documentos
            const resHistorial = await fetch("http://localhost:8000/api/historial-donaciones")
            const dataHistorial = await resHistorial.json()
            docs = (dataHistorial.donaciones || [])
              .map(doc => ({
                ...doc,
                doc_id: doc.id.replace('don-', ''),
                firma_status: doc.status,
                title: `Donación ${doc.Type === "dinero" ? "dinero" : "especie"} - ${doc.nombre_donante || "Donante desconocido"}`
              }))
          }
        }
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
    // eslint-disable-next-line
  }, [activeTab, user])

  // Cargar historial de firmas solo si es admin y hay documento seleccionado
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

  if (!user) {
    return <div>Cargando...</div>
  }

  const filteredDocuments = documents.filter((doc) => {
    // Ya no necesitamos filtrar aquí porque todo el filtrado se hace en fetchDocuments
    return true
  })

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
      case "firmado":
      case "signed":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "pendiente":
      case "pending":
        return <Clock className="h-5 w-5 text-amber-500" />
      case "rechazado":
      case "rejected":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return null
    }
  }

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case "firmado":
      case "signed":
        return "Firmado"
      case "pendiente":
      case "pending":
        return "Pendiente"
      case "rechazado":
      case "rejected":
        return "Rechazado"
      default:
        return status
    }
  }

  const loadDocumentContent = async (doc: any) => {
    try {
      const documentId = doc.doc_id || doc.id;
      const fileType = doc.sharepoint_url.toLowerCase().split('.').pop();
      
      // Determinar si debemos usar el archivo firmado
      const useFirmado = doc.firma_status === "firmado" && fileType === "docx";
      const url = `http://localhost:8000/api/documents/download/${documentId}${useFirmado ? '?firmado=true' : ''}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error al descargar el documento: ${response.statusText}`);
      }

      const blob = await response.blob();
      
      if (fileType === 'pdf') {
        const url = URL.createObjectURL(blob);
        setDocContent(url);
      } else if (fileType === 'docx') {
        try {
          const arrayBuffer = await blob.arrayBuffer();
          const result = await mammoth.convertToHtml({ arrayBuffer });
          setDocContent(result.value);
        } catch (mammothError) {
          console.error('Error al convertir DOCX:', mammothError);
          setDocContent(`
            <div class="p-4 text-center">
              <p class="text-red-500 mb-4">No se pudo previsualizar el documento DOCX.</p>
              <p class="text-sm text-gray-500">Por favor, descarga el documento para verlo.</p>
            </div>
          `);
        }
      } else {
        setDocContent(`
          <div class="p-4 text-center">
            <p class="text-gray-500">Este tipo de archivo no se puede previsualizar.</p>
            <p class="text-sm text-gray-500">Por favor, descarga el documento para verlo.</p>
          </div>
        `);
      }
    } catch (error) {
      console.error('Error al cargar el documento:', error);
      setDocContent(`
        <div class="p-4 text-center">
          <p class="text-red-500 mb-4">Error al cargar el documento.</p>
          <p class="text-sm text-gray-500">Por favor, intenta descargarlo.</p>
        </div>
      `);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Documentos</h1>
        <p className="text-muted-foreground">Gestiona los documentos que requieren tu firma</p>
      </div>

      <Tabs defaultValue="pending" onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="pending">Pendientes</TabsTrigger>
          <TabsTrigger value="signed">Firmados</TabsTrigger>
          <TabsTrigger value="rejected">Rechazados</TabsTrigger>
          <TabsTrigger value="all">Todos</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {loading ? (
            <div className="text-center py-10">Cargando documentos...</div>
          ) : filteredDocuments.length === 0 ? (
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
              {filteredDocuments.map((doc) => (
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedDocument(doc)
                        setIsDialogOpen(true)
                      }}
                    >
                      Ver documento
                    </Button>
                    {doc.firma_status === "pendiente" && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedDocument(doc)
                          setIsDialogOpen(true)
                        }}
                      >
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

      {/* Document Preview Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          {selectedDocument && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedDocument.title}</DialogTitle>
                <DialogDescription>
                  Creado por: {selectedDocument.creador_nombre} el {new Date(selectedDocument.created_at).toLocaleDateString()}
                </DialogDescription>
              </DialogHeader>

              <div className="max-h-[60vh] overflow-y-auto rounded-md border p-4">
                {isLoadingDoc ? (
                  <div className="flex items-center justify-center h-[500px]">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                      <p className="text-gray-500">Cargando documento...</p>
                    </div>
                  </div>
                ) : (
                  (() => {
                    const fileType = selectedDocument.sharepoint_url.toLowerCase().split('.').pop();
                    
                    if (fileType === 'pdf') {
                      return (
                        <iframe
                          src={docContent}
                          title="Vista previa del documento PDF"
                          width="100%"
                          height="500px"
                          style={{ border: 'none' }}
                        />
                      );
                    } else if (fileType === 'docx') {
                      return (
                        <div 
                          className="prose max-w-none"
                          dangerouslySetInnerHTML={{ __html: docContent }}
                        />
                      );
                    } else {
                      return (
                        <div className="p-4 text-center">
                          <p className="text-gray-500">Este tipo de archivo no se puede previsualizar.</p>
                          <p className="text-sm text-gray-500">Por favor, descarga el documento para verlo.</p>
                        </div>
                      );
                    }
                  })()
                )}
              </div>

              <DialogFooter className="flex items-center justify-between sm:justify-between">
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => {
                    if (selectedDocument) {
                      const documentId = selectedDocument.doc_id || selectedDocument.id;
                      const fileType = selectedDocument.sharepoint_url.toLowerCase().split('.').pop();
                      const useFirmado = selectedDocument.firma_status === "firmado" && fileType === "docx";
                      const url = `http://localhost:8000/api/documents/download/${documentId}${useFirmado ? '?firmado=true' : ''}`;
                      window.open(url, "_blank");
                    }
                  }}
                >
                  <Download className="h-4 w-4" />
                  Descargar
                </Button>
                {selectedDocument.firma_status === "pendiente" && (
                  <Button 
                    onClick={() => handleSignDocument(selectedDocument)} 
                    disabled={isSigning} 
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    {isSigning ? "Firmando..." : "Firmar Documento"}
                  </Button>
                )}
              </DialogFooter>

              {user?.role === "admin" && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-2">Historial de firmas</h3>
                  {loadingFirmas ? (
                    <div>Cargando historial...</div>
                  ) : (
                    <ul className="space-y-2">
                      {firmas.map((f, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="font-mono text-xs text-gray-500">Paso {f.orden}:</span>
                          <span className="font-semibold">{f.nombre || <em>Pendiente</em>}</span>
                          <span className="text-xs">({f.rol})</span>
                          <span className={`text-xs ${f.status === 'firmado' ? 'text-green-600' : f.status === 'pendiente' ? 'text-yellow-600' : 'text-red-600'}`}>
                            {f.status}
                          </span>
                          {f.fecha_firma && (
                            <span className="text-xs text-gray-400 ml-2">
                              {new Date(f.fecha_firma).toLocaleString()}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
