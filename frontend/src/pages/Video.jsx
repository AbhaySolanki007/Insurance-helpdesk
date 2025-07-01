// import VideoBg from '../assets/videoplayback.mp4';
import VideoBg from '../assets/bg-blocks.mp4';

const VideoBackground = () => {
    return (
      <div className="relative w-full h-screen overflow-hidden">
        <video
          className="absolute top-0 left-0 w-full h-full object-cover"
          src={VideoBg}
          autoPlay
          loop
          muted
          playsInline
        />
        <div className="relative z-10 flex items-center justify-center h-full text-white">
          <h1 className="text-4xl font-bold">Welcome to My Page</h1>
        </div>
      </div>
    );
  };
  
  export default VideoBackground;
  