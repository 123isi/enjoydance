/** @jsxImportSource @emotion/react */
import axios from "axios";
import { useEffect, useState } from "react";
import styled from "@emotion/styled";
import PlayerBar from "./PlayerBar.tsx";

type Song = {
  rank: number;
  title: string;
  artist: string;
  albumImageUrl?: string;
};
type YoutubeResult = {
  videoId: string;
  title: string;
};


export default function App() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [selected, setSelected] = useState<Song | null>(null);
  const placeholderUrl = "https://via.placeholder.com/60";
  const [youtubeData, setYoutubeData] = useState<YoutubeResult | null>(null);
  const handleNext = () => {
    if (!selected) return;
    const idx = songs.findIndex(s => s.rank === selected.rank);
    const next = songs[(idx + 1) % songs.length];
    setSelected(next);
  };
  // 이전 곡 선택
  const handlePrev = () => {
    if (!selected) return;
    const idx = songs.findIndex(s => s.rank === selected.rank);
    const prev = songs[(idx - 1 + songs.length) % songs.length];
    setSelected(prev);
  };
  useEffect(() => {
    axios.get("/melon")
    .then((res) => {
      const dataWithImage = res.data.map((song: Song) => ({
        ...song,
        albumImageUrl: placeholderUrl, // 👈 여기!
      }));
      setSongs(dataWithImage);
    })
    .catch((err) => console.error("멜론 API 실패", err));
  }, []);
  useEffect(() => {
    if (!selected) return;
  
    axios
  .get("/melon/search", {
    params: { q: `${selected.title} ${selected.artist}` },
  })
  .then((res) => {
    setYoutubeData(res.data); // { videoId, title }
  })

  }, [selected]);
  
  return (
    <Wrapper>
      <Title>🎵 멜론 TOP 100</Title>
      <List>
        {songs.map((song) => (
          <Item key={song.rank} onClick={() => setSelected(song)}>
<AlbumImg src={song.albumImageUrl} />
            <Info>
              <Rank>{song.rank}</Rank>
              <div>
                <TitleText>{song.title}</TitleText>
                <ArtistText>{song.artist}</ArtistText>
              </div>
            </Info>
          </Item>
        ))}
      </List>
      {selected && youtubeData && (
  <PlayerBar
    title={selected.title}
    artist={selected.artist}
    albumImageUrl={`https://img.youtube.com/vi/${youtubeData.videoId}/0.jpg`}
    videoId={youtubeData.videoId}
    onNext={handleNext}
    onPrev={handlePrev}
  />
)}

    </Wrapper>
  );
}
const Wrapper = styled.div`
  width: 100%;
  padding-bottom: 140px;
  display: flex;
  justify-content: center;
`;

const Title = styled.h1`
  text-align: center;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Item = styled.div`
  display: flex;
  align-items: center;
  padding: 0.75rem;
  gap: 1rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: transform 0.1s;
  &:hover {
    transform: scale(1.01);
  }
`;
const AlbumImg = styled.img`
  width: 60px;
  height: 60px;
  border-radius: 8px;
  object-fit: cover;
`;

const Info = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const Rank = styled.div`
  font-weight: bold;
  font-size: 1.2rem;
  width: 30px;
`;

const TitleText = styled.div`
  font-size: 1rem;
  font-weight: 600;
`;

const ArtistText = styled.div`
  font-size: 0.9rem;
  color: #777;
`;
