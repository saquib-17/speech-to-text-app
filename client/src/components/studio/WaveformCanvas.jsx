import { useEffect, useRef } from "react";

export const WaveformCanvas = ({
  analyser,
  isRecording = false,
  isPaused = false,
  className = "",
  barColor = "#C87932",
  activeColor = "#E89548",
}) => {
  const canvasRef = useRef(null);
  const animationFrameIdRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Scale canvas for high-DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    let dataArray = null;
    let bufferLength = 0;

    if (analyser) {
      bufferLength = analyser.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw subtle horizontal center line
      ctx.strokeStyle = "#E7E0D6";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      const numBars = Math.floor(width / 6); // 3px bar width + 3px gap
      const barWidth = 3;
      const barGap = 3;

      if (analyser && isRecording && !isPaused && dataArray) {
        analyser.getByteFrequencyData(dataArray);

        for (let i = 0; i < numBars; i++) {
          const sampleIndex = Math.floor((i / numBars) * (bufferLength * 0.7));
          const val = dataArray[sampleIndex] || 0;
          const percent = val / 255;
          const minHeight = 4;
          const barHeight = Math.max(minHeight, percent * (height * 0.85));

          const x = i * (barWidth + barGap);
          const y = (height - barHeight) / 2;

          // Gradient color: Royal Amber base to Soft Amber peak
          const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
          gradient.addColorStop(0, percent > 0.4 ? activeColor : barColor);
          gradient.addColorStop(0.5, barColor);
          gradient.addColorStop(1, "rgba(200, 121, 50, 0.45)");

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, 2);
          ctx.fill();
        }
      } else {
        // Idle or paused state: draw calm ambient soundwave baseline
        const time = Date.now() * 0.002;
        for (let i = 0; i < numBars; i++) {
          const x = i * (barWidth + barGap);
          const wave = isPaused
            ? 5
            : Math.sin(i * 0.15 + time) * 6 + Math.cos(i * 0.08 - time) * 4;
          const barHeight = Math.max(4, Math.abs(wave) + 4);
          const y = (height - barHeight) / 2;

          ctx.fillStyle = isPaused
            ? "rgba(232, 149, 72, 0.45)" // Soft amber for paused
            : "rgba(200, 121, 50, 0.15)"; // Royal amber idle baseline
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, 2);
          ctx.fill();
        }
      }

      animationFrameIdRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [analyser, isRecording, isPaused, barColor, activeColor]);

  return (
    <div className={`relative w-full h-20 sm:h-24 overflow-hidden rounded-lg bg-pure-white border border-warm-grey shadow-2xs ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />
    </div>
  );
};

export default WaveformCanvas;
