"use client"

import { useState, useRef, useCallback } from "react"
import Webcam from "react-webcam"
import Tesseract from "tesseract.js"
import { Loader2, Camera, CheckCircle, XCircle, ChevronRight, ChevronLeft } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"

const MODELS = ["iPhone 11", "iPhone 12", "iPhone 13", "Samsung S21", "Samsung S22"]

type FaultTree = {
  screen: "broken" | "working" | "unknown"
  display?: "working" | "not_working" // if screen broken
  board: "working" | "not_working" | "unknown"
  battery: "good" | "bad" | "unknown"
}

export default function SellPage() {
  const { data: session } = authClient.useSession()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // Form Data
  const [model, setModel] = useState("")
  const [faults, setFaults] = useState<FaultTree>({
    screen: "unknown",
    board: "unknown",
    battery: "unknown"
  })
  const [imei, setImei] = useState("")
  const [price, setPrice] = useState("")
  const [photos, setPhotos] = useState<string[]>([])

  // Camera
  const webcamRef = useRef<Webcam>(null)
  const [scanning, setScanning] = useState(false)
  const [overlay, setOverlay] = useState<"front" | "back" | "imei">("front")

  // Price Suggestion Logic
  const getSuggestedPrice = useCallback(() => {
    let base = 0;
    if (model.includes("iPhone 13")) base = 1200;
    else if (model.includes("iPhone 12")) base = 900;
    else if (model.includes("iPhone 11")) base = 600;
    else if (model.includes("S22")) base = 1000;
    else if (model.includes("S21")) base = 700;
    else base = 500; // Default

    let multiplier = 1;
    if (faults.screen === 'broken') multiplier -= 0.3;
    if (faults.board === 'not_working') multiplier -= 0.5;
    if (faults.battery === 'bad') multiplier -= 0.1;

    return Math.max(0, Math.round(base * multiplier));
  }, [model, faults]);

  const suggestedPrice = getSuggestedPrice();

  const captureAndScan = useCallback(async () => {
    if (!webcamRef.current) return
    const imageSrc = webcamRef.current.getScreenshot()
    if (!imageSrc) return

    setScanning(true)
    try {
      const { data: { text } } = await Tesseract.recognize(imageSrc, 'eng', {
        logger: m => console.log(m)
      })
      
      // Simple regex for 15 digit IMEI
      const found = text.match(/\b\d{15}\b/)
      if (found) {
        setImei(found[0])
        toast.success("IMEI tapıldı!")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setScanning(false)
    }
  }, [webcamRef])

  const dataURLtoFile = (dataurl: string, filename: string) => {
    const arr = dataurl.split(',')
    const mime = arr[0].match(/:(.*?);/)?.[1]
    const bstr = atob(arr[arr.length - 1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while(n--){
      u8arr[n] = bstr.charCodeAt(n)
    }
    return new File([u8arr], filename, {type:mime})
  }

  const handleSubmit = async () => {
    if (!session) {
      toast.error("Zəhmət olmasa giriş edin")
      router.push("/sign-in")
      return
    }
    
    setLoading(true)
    try {
      // Upload photos first
      const uploadedUrls: string[] = []
      
      for (let i = 0; i < photos.length; i++) {
        const file = dataURLtoFile(photos[i], `photo-${i}.jpg`)
        const formData = new FormData()
        formData.append("file", file)

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData
        })

        if (uploadRes.ok) {
          const data = await uploadRes.json()
          uploadedUrls.push(data.url)
        }
      }

      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelName: model,
          faultTree: faults,
          imei,
          price: Number(price),
          photos: uploadedUrls
        })
      })

      if (!res.ok) throw new Error("Xəta")
      
      toast.success("Elan yaradıldı!")
      router.push("/")
    } catch (e) {
      console.error(e)
      toast.error("Elan yaratmaq mümkün olmadı")
    } finally {
      setLoading(false)
    }
  }

  // Step 1: Model Selection
  if (step === 1) {
    return (
      <div className="p-4 max-w-md mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-white">Model Seçimi</h1>
        <div className="grid gap-2">
          {MODELS.map(m => (
            <button
              key={m}
              onClick={() => { setModel(m); setStep(2) }}
              className={`p-4 rounded-lg border text-left transition-colors ${model === m ? 'bg-green-900/30 border-green-500 text-green-400' : 'bg-gray-900 border-gray-800 text-gray-300 hover:bg-gray-800'}`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Step 2: Fault Tree
  if (step === 2) {
    return (
      <div className="p-4 max-w-md mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-white">Vəziyyət</h1>
        
        <div className="space-y-4">
          <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
            <label className="block text-sm text-gray-400 mb-2">Ekran şüşəsi sınıqdır?</label>
            <div className="flex gap-2">
              <button 
                onClick={() => setFaults({ ...faults, screen: "broken" })}
                className={`flex-1 p-2 rounded border ${faults.screen === 'broken' ? 'bg-red-900/30 border-red-500 text-red-400' : 'border-gray-700'}`}
              >
                Bəli
              </button>
              <button 
                onClick={() => setFaults({ ...faults, screen: "working" })}
                className={`flex-1 p-2 rounded border ${faults.screen === 'working' ? 'bg-green-900/30 border-green-500 text-green-400' : 'border-gray-700'}`}
              >
                Xeyr
              </button>
            </div>
          </div>

          {faults.screen === 'broken' && (
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-800 animate-in fade-in slide-in-from-top-2">
              <label className="block text-sm text-gray-400 mb-2">Görüntü var?</label>
              <div className="flex gap-2">
                <button 
                  onClick={() => setFaults({ ...faults, display: "working" })}
                  className={`flex-1 p-2 rounded border ${faults.display === 'working' ? 'bg-green-900/30 border-green-500 text-green-400' : 'border-gray-700'}`}
                >
                  Bəli
                </button>
                <button 
                  onClick={() => setFaults({ ...faults, display: "not_working" })}
                  className={`flex-1 p-2 rounded border ${faults.display === 'not_working' ? 'bg-red-900/30 border-red-500 text-red-400' : 'border-gray-700'}`}
                >
                  Xeyr
                </button>
              </div>
            </div>
          )}

          <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
            <label className="block text-sm text-gray-400 mb-2">Plata (Ana plata)</label>
            <div className="flex gap-2">
              <button 
                onClick={() => setFaults({ ...faults, board: "working" })}
                className={`flex-1 p-2 rounded border ${faults.board === 'working' ? 'bg-green-900/30 border-green-500 text-green-400' : 'border-gray-700'}`}
              >
                İşlək
              </button>
              <button 
                onClick={() => setFaults({ ...faults, board: "not_working" })}
                className={`flex-1 p-2 rounded border ${faults.board === 'not_working' ? 'bg-red-900/30 border-red-500 text-red-400' : 'border-gray-700'}`}
              >
                Xarab
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button onClick={() => setStep(1)} className="flex-1 p-3 rounded bg-gray-800 text-white">Geri</button>
          <button onClick={() => setStep(3)} className="flex-1 p-3 rounded bg-green-600 text-white">Növbəti</button>
        </div>
      </div>
    )
  }

  // Step 3: IMEI & Price
  if (step === 3) {
    return (
      <div className="p-4 max-w-md mx-auto space-y-6 pb-24">
        <h1 className="text-2xl font-bold text-white">IMEI və Qiymət</h1>

        <div className="bg-gray-900 p-4 rounded-lg border border-gray-800 space-y-4">
          <label className="block text-sm text-gray-400">Cihazın Şəkilləri</label>
          
          {/* Overlay Selector */}
          <div className="flex gap-2 mb-2">
            <button 
              onClick={() => setOverlay("front")}
              className={`text-xs px-3 py-1 rounded-full border ${overlay === 'front' ? 'bg-green-600 border-green-600 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
            >
              Ön Hissə
            </button>
            <button 
              onClick={() => setOverlay("back")}
              className={`text-xs px-3 py-1 rounded-full border ${overlay === 'back' ? 'bg-green-600 border-green-600 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
            >
              Arxa Hissə
            </button>
            <button 
              onClick={() => setOverlay("imei")}
              className={`text-xs px-3 py-1 rounded-full border ${overlay === 'imei' ? 'bg-green-600 border-green-600 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
            >
              IMEI
            </button>
          </div>

          <div className="relative aspect-video bg-black rounded overflow-hidden border border-gray-700">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: "environment" }}
              className="w-full h-full object-cover"
            />
            
            {/* Guide Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-50 border-2 border-white/30 m-4 rounded-lg">
              {overlay === 'front' && (
                <div className="w-3/4 h-5/6 border-2 border-dashed border-white rounded-3xl flex items-center justify-center">
                  <span className="text-white font-bold bg-black/50 px-2 rounded">Ön Ekranı Çərçivəyə Salın</span>
                </div>
              )}
              {overlay === 'back' && (
                <div className="w-3/4 h-5/6 border-2 border-dashed border-white rounded-3xl flex items-center justify-center">
                  <span className="text-white font-bold bg-black/50 px-2 rounded">Arxa Hissəni Çərçivəyə Salın</span>
                </div>
              )}
              {overlay === 'imei' && (
                <div className="w-3/4 h-1/4 border-2 border-dashed border-green-400 bg-green-400/10 flex items-center justify-center">
                  <span className="text-green-400 font-bold bg-black/50 px-2 rounded">IMEI Kodunu Buraya Yerləşdirin</span>
                </div>
              )}
            </div>

            <div className="absolute bottom-4 right-4 flex gap-2 pointer-events-auto">
               <button 
                onClick={captureAndScan}
                disabled={scanning}
                className="bg-white/20 backdrop-blur-md text-white p-2 rounded-full shadow-lg border border-white/30"
                title="IMEI Skan et"
              >
                {scanning ? <Loader2 className="animate-spin w-5 h-5" /> : <span className="text-xs font-bold px-1">IMEI</span>}
              </button>
              <button 
                onClick={() => {
                  const src = webcamRef.current?.getScreenshot();
                  if (src) {
                    setPhotos([...photos, src]);
                    toast.success("Şəkil əlavə olundu");
                  }
                }}
                className="bg-white text-black p-2 rounded-full shadow-lg"
                title="Şəkil çək"
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Photo Thumbnails */}
          {photos.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {photos.map((src, idx) => (
                <div key={idx} className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border border-gray-700 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Photo ${idx}`} className="w-full h-full object-cover" />
                  <button 
                    onClick={() => setPhotos(photos.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div>
            <label className="block text-sm text-gray-400">IMEI (15 rəqəm)</label>
            <input
              type="text"
              value={imei}
              onChange={(e) => setImei(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white mt-1"
              placeholder="354..."
            />
          </div>
        </div>

        <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
          <label className="block text-sm text-gray-400">Qiymət (AZN)</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white mt-1 text-lg font-bold"
            placeholder="0"
          />
          {suggestedPrice > 0 && (
            <div className="mt-2 text-sm text-gray-400 flex items-center gap-2">
              <span>Təklif olunan bazar qiyməti: <span className="text-green-400 font-bold">{suggestedPrice} AZN</span></span>
              <button 
                onClick={() => setPrice(suggestedPrice.toString())}
                className="text-xs bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded border border-gray-700 transition-colors"
              >
                Tətbiq et
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <button onClick={() => setStep(2)} className="flex-1 p-3 rounded bg-gray-800 text-white">Geri</button>
          <button 
            onClick={handleSubmit} 
            disabled={loading || !imei || !price}
            className="flex-1 p-3 rounded bg-green-600 text-white disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin mx-auto" /> : "Elanı Paylaş"}
          </button>
        </div>
      </div>
    )
  }

  return null
}
