/** @jsxImportSource @emotion/react */
import axios from "axios";
import { useEffect, useState } from "react";
import styled from "@emotion/styled";
import PlayerBar from "./PlayerBar.tsx";
import { useYoutubeImageStore } from './useYoutubeImageStore';

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
  const { imageMap, setImage } = useYoutubeImageStore();
  const [songs, setSongs] = useState<Song[]>([]);
  const [selected, setSelected] = useState<Song | null>(null);
  const placeholderUrl = "https://via.placeholder.com/60";
  const [youtubeData, setYoutubeData] = useState<YoutubeResult | null>(null);
  const [search, setSearch] = useState("");
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [isPlayingPlaylist, setIsPlayingPlaylist] = useState(false);
  const [viewMode, setViewMode] = useState<"ranking" | "playlist">("ranking");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "register" | null>(null);

useEffect(() => {
  axios.get("http://127.0.0.1:8000/me", { withCredentials: true })
    .then(() => setIsLoggedIn(true))
    .catch(() => setIsLoggedIn(false));
}, []);
  const filteredSongs = songs.filter(song =>
    song.title.toLowerCase().includes(search.toLowerCase()) ||
    song.artist.toLowerCase().includes(search.toLowerCase())
  );
  const toggleInPlaylist = (song: Song) => {
    setPlaylist(prev => {
      const exists = prev.find(s => s.rank === song.rank);
      if (exists) return prev.filter(s => s.rank !== song.rank);
      else return [...prev, song];
    });
  };
  useEffect(() => {
    if (viewMode === "playlist") {
      axios.get("http://127.0.0.1:8000/playlist")
        .then((res) => {
          if (Array.isArray(res.data)) {
            setPlaylist(res.data);
          } else {
            console.warn("예상과 다른 응답:", res.data);
            setPlaylist([]);
          }
        })
        .catch((err) => {
          console.error("플레이리스트 요청 실패:", err);
          setPlaylist([]);
        });
    }
  }, [viewMode]);
  
  const handleNext = () => {
    const list = isPlayingPlaylist ? playlist : songs;
    if (!selected) return;
    const idx = list.findIndex(s => s.rank === selected.rank);
    const next = list[(idx + 1) % list.length];
    setSelected(next);
  };
  
  const handlePrev = () => {
    const list = isPlayingPlaylist ? playlist : songs;
    if (!selected) return;
    const idx = list.findIndex(s => s.rank === selected.rank);
    const prev = list[(idx - 1 + list.length) % list.length];
    setSelected(prev);
  };
  
  useEffect(() => {
    axios.get("/melon")
      .then(async (res) => {
        const enriched = await Promise.all(
          res.data.map(async (song: Song) => {
            const key = `${song.title}-${song.artist}`;
  
            // 전역 상태에 있으면 그걸 써
            if (imageMap[key]) {
              return { ...song, albumImageUrl: imageMap[key] };
            }
  
            // 없으면 YouTube 검색 후 상태에 저장
            try {
              const searchRes = await axios.get("/melon/search", {
                params: { q: `${song.title} ${song.artist}` },
              });
              const videoId = searchRes.data.videoId;
              const imageUrl = `https://img.youtube.com/vi/${videoId}/0.jpg`;
              setImage(key, imageUrl); // Zustand에 저장
              return { ...song, albumImageUrl: imageUrl };
            } catch (err) {
              console.error("검색 실패:", key);
              return { ...song, albumImageUrl: placeholderUrl };
            }
          })
        );
  
        setSongs(enriched);
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
    setYoutubeData(res.data); 
  })

  }, [selected]);
  
  useEffect(() => {
    if (viewMode === "playlist") {
      axios.get("http://127.0.0.1:8000/playlist")
        .then(async (res) => {
          if (Array.isArray(res.data)) {
            const enriched = await Promise.all(
              res.data.map(async (song: Song) => {
                const key = `${song.title}-${song.artist}`;
  
                if (song.albumImageUrl) return song;
  
                if (imageMap[key]) {
                  return { ...song, albumImageUrl: imageMap[key] };
                }
  
                try {
                  const searchRes = await axios.get("/melon/search", {
                    params: { q: `${song.title} ${song.artist}` },
                  });
                  const videoId = searchRes.data.videoId;
                  const imageUrl = `https://img.youtube.com/vi/${videoId}/0.jpg`;
                  setImage(key, imageUrl);
                  return { ...song, albumImageUrl: imageUrl };
                } catch (err) {
                  return { ...song, albumImageUrl: placeholderUrl };
                }
              })
            );
            setPlaylist(enriched);
          } else {
            console.warn("예상과 다른 응답:", res.data);
            setPlaylist([]);
          }
        })
        .catch((err) => {
          console.error("플레이리스트 요청 실패:", err);
          setPlaylist([]);
        });
    }
  }, [viewMode]);
  
  return (
    <>
    {!isLoggedIn && (
  <div style={{ marginTop: "2rem", display: "flex", gap: "1rem" }}>
    <button onClick={() => setAuthMode("login")}>🔐 로그인</button>
    <button onClick={() => setAuthMode("register")}>📝 회원가입</button>
  </div>
)}
    {authMode === "login" && (
  <LoginBox>
    <h3>로그인</h3>
    <input
      type="text"
      placeholder="아이디"
      value={username}
      onChange={(e) => setUsername(e.target.value)}
    />
    <input
      type="password"
      placeholder="비밀번호"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
    />
    <button
      onClick={() => {
        axios
  .post("http://127.0.0.1:8000/login", { username, password })
  .then((res) => {
    if (res.data.error) {
      alert(res.data.error);  // ❗ 에러 응답 처리
      return;
    }

    alert("로그인 성공");
    document.cookie = `access_token=${res.data.token}; path=/`;
    setIsLoggedIn(true);
    setAuthMode(null);
  })
  .catch(() => alert("로그인 실패"));

      }}
    >
      로그인
    </button>
    <button onClick={() => setAuthMode(null)}>닫기</button>
  </LoginBox>
)}

{authMode === "register" && (
  <LoginBox>
    <h3>회원가입</h3>
    <input
      type="text"
      placeholder="아이디"
      value={username}
      onChange={(e) => setUsername(e.target.value)}
    />
    <input
      type="password"
      placeholder="비밀번호"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
    />
    <button
  onClick={() => {
    console.log("회원가입 버튼 눌림");


    if (!username || !password) {
      alert("아이디와 비밀번호를 모두 입력해주세요.");
      return;
    }

    axios
      .post("http://127.0.0.1:8000/register", {
        username: username,
        password: password,
      })
      .then((res) => {
        if (res.data.error) {
          alert(res.data.error);  // ❗ 서버에서 온 에러
          return;
        }
        alert("회원가입 성공");
        setAuthMode("login");
      })
      .catch(() => alert("회원가입 실패"));
  }}
>
  회원가입
</button>

    <button onClick={() => setAuthMode(null)}>닫기</button>
  </LoginBox>
)}
    {isLoggedIn && !authMode && (
    <Wrapper>
      <TabBar>
  <button
    className={viewMode === "ranking" ? "active" : ""}
    onClick={() => setViewMode("ranking")}
  >
    🎶 랭킹
  </button>
  <button
    className={viewMode === "playlist" ? "active" : ""}
    onClick={() => setViewMode("playlist")}
  >
    📂 플레이리스트
  </button>
</TabBar>

<TableWrapper>
  <SearchInput
    type="text"
    placeholder="곡명 또는 아티스트 검색"
    value={search}
    onChange={(e) => setSearch(e.target.value)}
  />

  <StyledTable>
    <tbody>
      {(viewMode === "ranking"&& !authMode ? filteredSongs : playlist).map((song) => (
        <tr
          key={song.rank}
          onClick={(e) => {
            const tag = (e.target as HTMLElement).tagName.toLowerCase();
            if (tag === "input" || tag === "button") return;
            setSelected(song);
          }}
        >
          <td>
            {viewMode === "ranking"&& !authMode ? (
              <input
                type="checkbox"
                checked={playlist.some((p) => p.rank === song.rank)}
                onChange={(e) => {
                  e.stopPropagation();
                  toggleInPlaylist(song);
                }}
              />
            ) : (
              <DeleteButton
                onClick={(e) => {
                  e.stopPropagation();
                  axios
                    .delete(`http://127.0.0.1:8000/playlist/${song.rank}`)
                    .then(() => {
                      setPlaylist((prev) =>
                        prev.filter((p) => p.rank !== song.rank)
                      );
                    })
                    .catch(() => alert("삭제 실패"));
                }}
              >
                ❌
              </DeleteButton>
            )}
          </td>
          <td><AlbumImg src={song.albumImageUrl} size={50} /></td>
          <td className="title">{song.title}</td>
          <td>{song.artist}</td>
        </tr>
      ))}
    </tbody>
  </StyledTable>
</TableWrapper>

{selected && !authMode &&(
  <PlayerBar
    title={selected.title}
    artist={selected.artist}
    videoId={youtubeData?.videoId}
    onNext={handleNext}
    onPrev={handlePrev}
  />
)}
{playlist.length > 0 && !authMode && (
  <FixedPlaylistBar>
    <div>🎵 선택된 곡: {playlist.length}곡</div>

    {viewMode === "playlist" && (
      <>
        <button
          onClick={() => {
            setIsPlayingPlaylist(true);
            setSelected(playlist[0]);
          }}
        >
          ▶️ 플레이리스트 재생
        </button>

        <button
          onClick={() => {
            const shuffled = [...playlist].sort(() => Math.random() - 0.5);
            setIsPlayingPlaylist(true);
            setPlaylist(shuffled);
            setSelected(shuffled[0]);
          }}
        >
          🔀 셔플 재생
        </button>
      </>
    )}
  
    <button
      onClick={() => {
        if (!isLoggedIn) {
          alert("로그인이 필요합니다.");
          return;
        }
        const simplified = playlist.map(({ rank, title, artist, albumImageUrl }) => ({
          rank,
          title,
          artist,
          albumImageUrl,
        }));
        axios
          .post("http://127.0.0.1:8000/playlist", { songs: simplified })
          .then(() => {
            alert("저장 완료!");
            setViewMode("playlist");
          })
          .catch(() => alert("저장 실패!"));
      }}
    >
      💾 저장하기
    </button>
  </FixedPlaylistBar>
)}




</Wrapper>
    )}
  </>
  );
}
const Wrapper = styled.div`
  width: 100%;
  padding-bottom: 140px;
  display: flex;
  flex-direction: column; /* 🔥 이거 추가 */
  align-items: center;     /* 🔥 가운데 정렬 */
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
const TableWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-bottom: 140px;
`;


const StyledTable = styled.table`
  border-collapse: collapse;
  width: 90%;
  max-width: 1000px;
  font-size: 1rem;

  th, td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #eee;
  }

  tbody tr {
    transition: background 0.2s;
    cursor: pointer;
  }

  tbody tr:hover {
    background-color: #f9f9f9;
  }

  th {
    font-weight: bold;
    color: #333;
  }

  .title {
    font-weight: 600;
  }
`;

const AlbumImg = styled.img<{ size?: number }>`
  width: ${({ size = 60 }) => size}px;
  height: ${({ size = 60 }) => size}px;
  border-radius: 6px;
  object-fit: cover;
`;
const SearchInput = styled.input`
  width: 90%;
  max-width: 1000px;
  height: 44px;
  margin-bottom: 1.5rem;
  padding: 0 1rem;
  border: 1px solid #ccc;
  border-radius: 9999px;
  font-size: 1rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #1db954;
    box-shadow: 0 0 0 2px rgba(30, 215, 96, 0.3);
  }

  &::placeholder {
    color: #aaa;
  }
`;

const PlayListControl = styled.div`
  width: 90%;
  max-width: 1000px;
  margin: 2rem auto 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;

  div {
    font-size: 1rem;
    font-weight: 500;
    color: #444;
  }

  button {
    background-color: #1db954;
    color: white;
    border: none;
    border-radius: 9999px;
    padding: 0.6rem 1.5rem;
    font-size: 0.95rem;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
      background-color: #17a44d;
    }
  }
`;
const FixedPlaylistBar = styled.div`
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  background: white;
  border-radius: 9999px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 0.8rem 1.8rem;
  display: flex;
  align-items: center;
  gap: 1rem;

  div {
    font-size: 1rem;
    font-weight: 500;
    color: #444;
  }

  button {
    background-color: #1db954;
    color: white;
    border: none;
    border-radius: 9999px;
    padding: 0.5rem 1.4rem;
    font-size: 0.95rem;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
      background-color: #17a44d;
    }
  }
`;
const TabBar = styled.div`
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin: 1.5rem 0;

  button {
    font-size: 1.1rem;
    font-weight: 600;
    background: none;
    border: none;
    border-bottom: 3px solid transparent;
    padding: 0.5rem 1rem;
    cursor: pointer;
    transition: border-color 0.2s;

    &.active {
      border-color: #1db954;
      color: #1db954;
    }

    &:hover {
      border-color: #ccc;
    }
  }
`;
const NoPlaylistNotice = styled.div`
  width: 90%;
  max-width: 1000px;
  margin-bottom: 1rem;
  padding: 1rem;
  text-align: center;
  background: #f9f9f9;
  border: 1px solid #eee;
  border-radius: 12px;
  color: #666;
  font-size: 1rem;
`;

const DeleteButton = styled.button`
  background: none;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  color: #e74c3c;
  &:hover {
    color: #c0392b;
  }
`;
const LoginBox = styled.div`
  width: 100%;
  max-width: 400px;
  margin: 2rem auto;
  padding: 1.5rem;
  background: #f3f3f3;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  h3 {
    text-align: center;
    color: #333;
  }

  input {
    padding: 0.75rem;
    border: 1px solid #ccc;
    border-radius: 9999px;
    font-size: 1rem;
  }

  button {
    padding: 0.6rem;
    font-size: 1rem;
    font-weight: bold;
    color: white;
    background: #1db954;
    border: none;
    border-radius: 9999px;
    cursor: pointer;
    &:hover {
      background: #17a44d;
    }
  }
`;
