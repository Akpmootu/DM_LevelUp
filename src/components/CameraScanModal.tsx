import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Swal from 'sweetalert2';

interface CameraScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  documentTitle?: string;
}

export function CameraScanModal({ isOpen, onClose, onCapture, documentTitle }: CameraScanModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [brightness, setBrightness] = useState<number>(115); // Auto-enhanced slightly
  const [contrast, setContrast] = useState<number>(120);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [autoEnhance, setAutoEnhance] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode, capturedImage]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('ไม่สามารถเปิดกล้องได้ กรุณาตรวจสอบสิทธิ์การเข้าถึงกล้องบนเบราว์เซอร์');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setCapturedImage(dataUrl);
      stopCamera();
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handleApplyPhoto = () => {
    if (!capturedImage) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = capturedImage;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // Apply filter adjustments (brightness & contrast)
        const bVal = autoEnhance ? brightness : 100;
        const cVal = autoEnhance ? contrast : 100;
        ctx.filter = `brightness(${bVal}%) contrast(${cVal}%)`;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
          if (blob) {
            const cleanTitle = (documentTitle || 'เอกสารสแกน').replace(/[/\\?%*:|"<>]/g, '_').trim();
            const fileName = `scan_${Date.now()}_${cleanTitle}.jpg`;
            const file = new File([blob], fileName, { type: 'image/jpeg' });
            onCapture(file);
            onClose();
            Swal.fire({
              icon: 'success',
              title: 'สแกนเอกสารสำเร็จ! 📸',
              text: `แนบภาพถ่าย "${fileName}" เข้าสู่ระบบเรียบร้อยแล้ว`,
              timer: 1800,
              showConfirmButton: false,
            });
          }
        }, 'image/jpeg', 0.92);
      }
    };
  };

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-4 font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-slate-900 text-white rounded-3xl shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden border border-slate-800"
        >
          {/* Header */}
          <div className="px-5 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-lg">
                <i className="fa-solid fa-camera"></i>
              </div>
              <div>
                <h3 className="font-bold text-base text-white">สแกนเอกสารด้วยกล้อง</h3>
                <p className="text-xs text-slate-400">ถ่ายภาพเกียรติบัตร/คำสั่ง พร้อมระบบปรับแสงอัตโนมัติ</p>
              </div>
            </div>

            <button
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>

          {/* Body Video / Preview */}
          <div className="relative bg-black flex items-center justify-center min-h-[360px] max-h-[60vh] overflow-hidden">
            {!capturedImage ? (
              cameraError ? (
                <div className="text-center p-8 space-y-3 max-w-md">
                  <i className="fa-solid fa-triangle-exclamation text-amber-500 text-4xl"></i>
                  <p className="text-sm font-semibold text-slate-200">{cameraError}</p>
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition"
                  >
                    <i className="fa-solid fa-rotate-right mr-1"></i> ลองอีกครั้ง
                  </button>
                </div>
              ) : (
                <div className="relative w-full h-full flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain max-h-[55vh]"
                  />
                  {/* Document Framing Overlay */}
                  <div className="absolute inset-8 sm:inset-12 border-2 border-dashed border-amber-400/70 rounded-2xl pointer-events-none flex flex-col justify-between p-4 shadow-2xl">
                    <div className="text-[11px] font-bold bg-black/60 backdrop-blur-md text-amber-300 px-3 py-1 rounded-lg self-center border border-amber-500/30">
                      <i className="fa-solid fa-expand mr-1.5"></i> วางเอกสารให้อยู่ในกรอบ
                    </div>
                  </div>
                </div>
              )
            ) : (
              <div className="relative w-full h-full flex items-center justify-center p-4 bg-slate-950">
                <img
                  src={capturedImage}
                  alt="Captured Document"
                  style={{
                    filter: autoEnhance ? `brightness(${brightness}%) contrast(${contrast}%)` : 'none',
                  }}
                  className="max-h-[50vh] w-auto object-contain rounded-xl shadow-lg transition-all duration-200"
                />
              </div>
            )}
          </div>

          {/* Controls Bar */}
          <div className="p-4 sm:p-5 bg-slate-900 border-t border-slate-800 space-y-4">
            {capturedImage && (
              <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2 text-amber-400">
                    <i className="fa-solid fa-wand-magic-sparkles"></i>
                    <span>ปรับแต่งความคมชัดและแสงภาพสแกน</span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoEnhance}
                      onChange={(e) => setAutoEnhance(e.target.checked)}
                      className="accent-amber-500 rounded"
                    />
                    <span className="text-slate-300">เปิดปรับแสงสว่างอัตโนมัติ</span>
                  </label>
                </div>

                {autoEnhance && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>ความสว่าง (Brightness)</span>
                        <span className="font-bold text-amber-300">{brightness}%</span>
                      </div>
                      <input
                        type="range"
                        min="80"
                        max="160"
                        value={brightness}
                        onChange={(e) => setBrightness(Number(e.target.value))}
                        className="w-full accent-amber-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>ความคมชัด (Contrast)</span>
                        <span className="font-bold text-amber-300">{contrast}%</span>
                      </div>
                      <input
                        type="range"
                        min="80"
                        max="170"
                        value={contrast}
                        onChange={(e) => setContrast(Number(e.target.value))}
                        className="w-full accent-amber-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              {!capturedImage ? (
                <>
                  <button
                    onClick={toggleCameraFacing}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs transition flex items-center gap-2"
                  >
                    <i className="fa-solid fa-camera-rotate"></i>
                    <span className="hidden sm:inline">สลับกล้อง</span>
                  </button>

                  <button
                    onClick={handleCapture}
                    disabled={!!cameraError}
                    className="px-6 py-3 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold text-sm rounded-xl shadow-lg transition flex items-center gap-2 disabled:opacity-50"
                  >
                    <i className="fa-solid fa-circle-dot text-base"></i>
                    <span>ถ่ายภาพเอกสาร</span>
                  </button>

                  <button
                    onClick={() => {
                      stopCamera();
                      onClose();
                    }}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs transition"
                  >
                    ยกเลิก
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleRetake}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs transition flex items-center gap-2"
                  >
                    <i className="fa-solid fa-rotate-left"></i>
                    <span>ถ่ายใหม่</span>
                  </button>

                  <button
                    onClick={handleApplyPhoto}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-2"
                  >
                    <i className="fa-solid fa-check"></i>
                    <span>ใช้ภาพถ่ายนี้</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
