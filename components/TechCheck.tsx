
import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface TechCheckProps {
  onConfirm: () => void;
  onCancel: () => void;
}

const TechCheck: React.FC<TechCheckProps> = ({ onConfirm, onCancel }) => {
  const [hasPermissions, setHasPermissions] = useState<boolean | null>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const startStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setVideoStream(stream);
        setHasPermissions(true);
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Audio Visualization Setup
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
            const audioCtx = new AudioContextClass({});
            audioContextRef.current = audioCtx;
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            analyserRef.current = analyser;
            const source = audioCtx.createMediaStreamSource(stream);
            sourceRef.current = source;
            source.connect(analyser);

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const updateAudioLevel = () => {
                analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for(let i = 0; i < bufferLength; i++) {
                    sum += dataArray[i];
                }
                const average = sum / bufferLength;
                setAudioLevel(Math.min(100, average * 1.5)); // Scale up a bit
                animationRef.current = requestAnimationFrame(updateAudioLevel);
            };
            updateAudioLevel();
        }

      } catch (err) {
        console.error("Tech Check Error:", err);
        setHasPermissions(false);
      }
    };

    startStream();

    // CLEANUP FUNCTION: IMPORTANT
    // This runs when the component unmounts (e.g. when transitioning to VideoRoom)
    return () => {
      if (videoStream) {
        videoStream.getTracks().forEach(track => {
            track.stop();
            console.log("TechCheck: Camera track stopped.");
        });
      }
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioContextRef.current) {
          audioContextRef.current.close();
      }
    };
  }, []); // Empty dependency array means this only runs once on mount, and cleanup on unmount

  // Manual handler to ensure stream stop before state transition if needed
  const handleConfirm = () => {
      if (videoStream) {
          videoStream.getTracks().forEach(t => t.stop());
      }
      onConfirm();
  };

  const handleCancel = () => {
      if (videoStream) {
          videoStream.getTracks().forEach(t => t.stop());
      }
      onCancel();
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl max-w-lg w-full p-8 shadow-2xl animate-in zoom-in duration-300">
        <h2 className="text-2xl font-black text-white mb-6 text-center">Tech Check</h2>

        {hasPermissions === null && (
           <div className="flex flex-col items-center py-12">
               <Loader2 className="w-12 h-12 text-yellow-500 animate-spin mb-4" />
               <p className="text-gray-400">Verifying Camera & Mic...</p>
           </div>
        )}

        {hasPermissions === false && (
            <div className="text-center py-8">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="font-bold text-white text-lg mb-2">Access Denied</h3>
                <p className="text-gray-400 text-sm mb-6">We couldn't access your camera or microphone. Please allow permissions in your browser settings to continue.</p>
                <button onClick={handleCancel} className="bg-gray-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-700">Go Back</button>
            </div>
        )}

        {hasPermissions === true && (
            <div className="space-y-6">
                <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-gray-700 shadow-inner">
                    <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                    <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1 rounded-full text-xs font-bold text-white flex items-center gap-2">
                        <Video className="w-3 h-3 text-green-400" /> Camera Active
                    </div>
                </div>

                <div className="bg-gray-800 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-gray-400 uppercase">Microphone Check</span>
                        {audioLevel > 5 ? (
                            <span className="text-xs font-bold text-green-400 flex items-center gap-1"><Mic className="w-3 h-3" /> Detecting Audio</span>
                        ) : (
                            <span className="text-xs font-bold text-yellow-500 flex items-center gap-1"><MicOff className="w-3 h-3" /> Speak to test</span>
                        )}
                    </div>
                    {/* Audio Bar */}
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-green-500 transition-all duration-100 ease-out" 
                            style={{ width: `${audioLevel}%` }}
                        ></div>
                    </div>
                </div>

                <div className="flex gap-4 pt-2">
                    <button onClick={handleCancel} className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-bold transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleConfirm} className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-400 text-black rounded-xl font-bold shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                        <CheckCircle className="w-5 h-5" /> Join Session
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default TechCheck;
