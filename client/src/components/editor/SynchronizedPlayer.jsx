import { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";

export const SynchronizedPlayer = ({ audioUrl, durationSeconds = 0 }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleSpeedChange = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const nextIndex = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const nextSpeed = speeds[nextIndex];
    setPlaybackRate(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (!audioUrl) return null;

  return (
    <div className="p-2.5 sm:p-3 rounded-xl bg-[#FAF9FC] border border-[#EBE8F0] flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3 select-none shadow-2xs">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Play/Pause Button in Vibrant Orange */}
      <button
        onClick={togglePlay}
        className="w-8 h-8 sm:w-[34px] sm:h-[34px] rounded-full bg-[#F07800] hover:bg-[#D96B00] text-white flex items-center justify-center shrink-0 shadow-2xs active:scale-95 transition-all cursor-pointer"
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
      </button>

      {/* Current Time / Duration */}
      <span className="font-mono text-[11.5px] text-[#686B7A] shrink-0 min-w-[68px]">
        {formatTime(currentTime)} / {formatTime(durationSeconds || audioRef.current?.duration || 0)}
      </span>

      {/* Seek Range Slider */}
      <input
        type="range"
        min={0}
        max={durationSeconds || audioRef.current?.duration || 100}
        step={0.1}
        value={currentTime}
        onChange={handleSeek}
        className="w-full accent-[#F07800] h-1.5 bg-white rounded-lg cursor-pointer border border-[#EBE8F0]"
      />

      {/* Speed Rate Button */}
      <button
        onClick={handleSpeedChange}
        className="px-2 py-0.5 rounded-full bg-white hover:bg-[#FFF1E2] text-[#191B2B] font-mono text-[11px] font-bold shrink-0 transition-colors border border-[#EBE8F0] cursor-pointer shadow-2xs"
        title="Toggle playback speed"
      >
        {playbackRate}x
      </button>
    </div>
  );
};

export default SynchronizedPlayer;
