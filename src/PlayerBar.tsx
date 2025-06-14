import { useEffect, useRef, useState } from "react";
import styled from "@emotion/styled";
import { FaPlay, FaPause, FaStepForward, FaStepBackward, FaRedo, FaRandom, FaVolumeUp, FaListUl } from "react-icons/fa";


declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

type Props = {
  title: string;
  artist: string;
  albumImageUrl?: string;
  videoId?: string;
  onNext?: () => void;
  onPrev?: () => void;
};

export default function PlayerBar({ title, artist, albumImageUrl, videoId, onNext, onPrev }: Props) {
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  useEffect(() => {
    if (!videoId) return;
  
    // 1) 기존 플레이어 있으면 완전 제거
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  
    // 2) YouTube API 준비되면 새로 생성
    const onPlayerReady = (e: any) => {
      const p = e.target;
      setDuration(p.getDuration());
      p.playVideo();
    };
  
    const onStateChange = (e: any) => {
      const p = playerRef.current;
      setIsPlaying(e.data === window.YT.PlayerState.PLAYING);
      if (e.data === window.YT.PlayerState.PLAYING) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
          setCurrentTime(p.getCurrentTime());
          setDuration(p.getDuration());
        }, 1000);
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    };
  
    const create = () => {
      playerRef.current = new window.YT.Player("yt-player", {
        videoId,
        events: { onReady: onPlayerReady, onStateChange },
      });
    };
  
    if (!window.YT || !window.YT.Player) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
      window.onYouTubeIframeAPIReady = create;
    } else {
      create();
    }
  
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [videoId]);
  const togglePlay = () => {
    const p = playerRef.current;
    if (isPlaying) {
            p.pauseVideo();
          } else {
            p.playVideo();
          }
    // 클릭 즉시 토글 아이콘 반영ㅌ
    setIsPlaying(!isPlaying);
  };
  const formatTime = (t: number) => {
    const m = Math.floor(t / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(t % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <BarWrapper>
      <Left>
        {albumImageUrl ? <AlbumImg src={albumImageUrl} /> : <AlbumImgPlaceholder />}
        <SongInfo>
          <SongTitle>{title}</SongTitle>
          <ArtistName>{artist}</ArtistName>
        </SongInfo>
      </Left>

      <Center>
      <IconGroup>
        <FaRedo />
        <FaStepBackward onClick={() => onPrev && onPrev()} />
        <PlayPauseButton onClick={togglePlay}>
          {isPlaying ? <FaPause /> : <FaPlay />}
        </PlayPauseButton>
        <FaStepForward onClick={() => onNext && onNext()} />
        <FaRandom />
      </IconGroup>
        <TimeWrapper>
          <span>{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration}
            value={currentTime}
            step={1}
            onChange={(e) => {
              const val = Number(e.target.value);
              setCurrentTime(val);
              playerRef.current?.seekTo(val, true);
            }}
            style={{ width: "300px", accentColor: "#1db954" }}
          />
          <span>{formatTime(duration)}</span>
        </TimeWrapper>
      </Center>

      <Right>
        <VolumeWrapper>
          <FaVolumeUp />
          <VolumeBar />
        </VolumeWrapper>
      </Right>

      <div id="yt-player" style={{ display: "none" }}></div>
    </BarWrapper>
  );
}


const PlayPauseButton = styled.div`
  font-size: 1.4rem;
  cursor: pointer;
  color: white;
`;
const BarWrapper = styled.div`
  position: fixed;
  bottom: 0;
  width: 100%;
  height: 90px;
  background: #181818;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 2rem;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.3);
  z-index: 999;
`;

const Left = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const Center = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
`;

const Right = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const IconGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 6px;
`;

const TimeWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SongInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const SongTitle = styled.div`
  font-weight: bold;
`;

const ArtistName = styled.div`
  font-size: 0.85rem;
  color: #aaa;
`;

const AlbumImgPlaceholder = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 8px;
  background: #444;
`;

const AlbumImg = styled.img`
  width: 60px;
  height: 60px;
  border-radius: 8px;
  object-fit: cover;
`;

const PlayButton = styled(FaPlay)`
  font-size: 1.4rem;
  cursor: pointer;
`;

const VolumeBar = styled.div`
  width: 80px;
  height: 6px;
  background: #444;
  border-radius: 3px;
  position: relative;

  &::before {
    content: "";
    display: block;
    width: 50%;
    height: 100%;
    background: #1db954;
  }
`;

const VolumeWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;
