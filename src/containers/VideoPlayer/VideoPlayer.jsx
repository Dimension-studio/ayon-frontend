import {useState, useEffect, useRef} from 'react';
import styled from 'styled-components';

import VideoOverlay from './VideoOverlay';
import Trackbar from './Trackbar';
import VideoPlayerControls from './VideoPlayerControls';


const VideoPlayerContainer = styled.div`
  position: absolute;
  top: 0; 
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;

  gap: 12px;


  video {
    object-fit: fill !important;
  }

  .video-row {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    flex-grow: 1;

    .video-wrapper {
      position: relative;
    }
  }

  .trackbar-row {
    padding-left: 3px;
    padding-right: 3px;
  }

  .controls-row {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    width: 100%;
    gap: 6px;
    padding-bottom: 6px;
  }
`

const VideoPlayer = ({src, frameRate, aspectRatio}) => {

  const videoRef = useRef(null);
  const videoRowRef = useRef(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bufferedRanges, setBufferedRanges] = useState([]);
  const [showOverlay, setShowOverlay] = useState(true);

  const [videoDimensions, setVideoDimensions] = useState({
    width: 600,
    height: 400,
  })


  useEffect(() => {
    if (!videoRowRef.current) return


    const updateVideoDimensions = () => {
      const clientWidth = videoRowRef.current.clientWidth * .9
      const clientHeight = videoRowRef.current.clientHeight * .9

      if (clientWidth / clientHeight > aspectRatio) {
        const width = clientHeight * aspectRatio
        const height = clientHeight
        setVideoDimensions({ width, height })
      } else {
        const width = clientWidth
        const height = clientWidth / aspectRatio
        setVideoDimensions({ width, height })
      }

    }

    const resizeObserver = new ResizeObserver(updateVideoDimensions)
    resizeObserver.observe(videoRowRef.current)
    return () => resizeObserver.unobserve(videoRowRef.current)
  }, [videoRowRef])


  useEffect(() => {
    console.log('src changed', src)
    if (!videoRef.current) return
    videoRef.current.load()
  }, [src, videoRef])


  useEffect(() => {
    if (!videoRef.current) return
    // TODO:
    const frameLength = 0.04
    const updateTime = () => {
      const actualDuration = videoRef.current.duration
      if (actualDuration !== duration) {
        setDuration(actualDuration)
      }
      const actualTime = Math.min(
        videoRef.current?.currentTime || 0,
        actualDuration - frameLength
      )
      if (isPlaying) {
        setCurrentTime(actualTime)
        setTimeout(() => requestAnimationFrame(updateTime), 40)
      } else {
        setCurrentTime(actualTime)
      }
    }
    updateTime()
  }, [videoRef, isPlaying, duration])

  const handleLoad = (e) => {
    console.log('loaded', e)
    setIsPlaying(false)
    setCurrentTime(0)
    setBufferedRanges([])
  }

  const handleLoadedMetadata = (e) => {
    console.log('loaded metadata', e)
    setDuration(videoRef.current.duration)
    const width = videoRef.current.clientWidth
    const height = videoRef.current.clientHeight
    setVideoDimensions({ width, height })
    setIsPlaying(!videoRef.current.paused)
    setBufferedRanges([])
  }

  const handleProgress = (e) => {
    // create a list of buffered time ranges
    const buffered = e.target.buffered
    if (!buffered.length) return
    const bufferedRanges = []
    for (var i = 0; i < buffered.length; i++) {
      const r = { start: buffered.start(i), end: buffered.end(i) }
      bufferedRanges.push(r)
    }
    setBufferedRanges(bufferedRanges)
  }

  const handleScrub = (newTime) => {
    videoRef.current.pause()
    videoRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }


  return (
    <VideoPlayerContainer>
      <div className="video-row" ref={videoRowRef}>
        <div className="video-wrapper">
          <video
            ref={videoRef}
            width={videoDimensions.width}
            height={videoDimensions.height}
            src={src}
            onLoadedMetadata={handleLoadedMetadata}
            onProgress={handleProgress}
            onEnded={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onLoadedData={handleLoad}
          />
          <VideoOverlay
            videoWidth={videoDimensions.width}
            videoHeight={videoDimensions.height}
            showOverlay={showOverlay}
          />
        </div>
      </div>

      <div className="trackbar-row">
        <Trackbar
          currentTime={currentTime}
          duration={duration}
          bufferedRanges={bufferedRanges}
          onScrub={handleScrub}
        />
      </div>

      <div className="controls-row">
        <VideoPlayerControls videoRef={videoRef} isPlaying={isPlaying}/>
      </div>


    </VideoPlayerContainer>
  )
}

export default VideoPlayer;
