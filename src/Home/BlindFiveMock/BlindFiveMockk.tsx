import React, { useEffect, useRef, useState } from "react";
import './style.scss'
import './win.scss'
import './playerArea.scss'

const margin = 30;
const ROW = 18; // 바둑판 선 개수
const STONE_RADIUS = 19; // 바둑돌 크기
const COLORS = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'];
const CELL_SIZE = 800 + margin * 2; // 바둑판 전체 크기 (800px 판 + 마진)

/**
 * 초(sec)를 "MM:SS" 형식으로 변환합니다.
 */
const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return `${mm}:${ss}`;
};

const BlindFiveOmok: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // -------------- 기존 상태 --------------
  const [board, setBoard] = useState<{ ply: number; color: string }[][]>(
    Array.from({ length: ROW }, () => Array(ROW).fill({ ply: 0, color: '' }))
  );
  const [isBlackTurn, setIsBlackTurn] = useState(true);
  const [moves, setMoves] = useState<{ x: number; y: number }[]>([]);
  const [selectedColors, setSelectedColors] = useState<{ P1: string; P2: string }>({
    P1: 'red',
    P2: 'red'
  });
  const [winner, setWinner] = useState<number | null>(null);

  // -------------- 추가된 타이머 상태 --------------
  // P1(흑)과 P2(백)의 남은 시간(초 단위). 초기값 180초 = 3분
  const [timeP1, setTimeP1] = useState(180);
  const [timeP2, setTimeP2] = useState(180);

  // 이전에 생성된 인터벌 ID를 저장해 두었다가 정리합니다.
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // --------------------------------------------

  // 보드가 바뀔 때마다(돌이 놓일 때마다) 다시 그려줍니다.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        drawBoard(ctx);
        drawStones(ctx);
      }
    }
  }, [board]);

  // ------------ 타이머 인터벌 관리 ---------------
  useEffect(() => {
    // 게임이 끝났다면 인터벌을 정리만 하고 더 이상 카운트다운하지 않습니다.
    if (winner !== null) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // 턴이 바뀌면 기존 인터벌을 정리하고, 해당 플레이어의 타이머를 감소시키는 새 인터벌 생성
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // 흑의 턴이면 P1 카운트다운, 백의 턴이면 P2 카운트다운
    timerRef.current = setInterval(() => {
      if (isBlackTurn) {
        setTimeP1((prev) => {
          if (prev <= 1) {
            // 시간이 0초가 되면 백의 승리 처리
            clearInterval(timerRef.current!);
            setWinner(2);
            return 0;
          }
          return prev - 1;
        });
      } else {
        setTimeP2((prev) => {
          if (prev <= 1) {
            // 시간이 0초가 되면 흑의 승리 처리
            clearInterval(timerRef.current!);
            setWinner(1);
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isBlackTurn, winner]);
  // --------------------------------------------

  const drawBoard = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, CELL_SIZE, CELL_SIZE);
    ctx.fillStyle = "#d3e3fd";
    ctx.fillRect(0, 0, CELL_SIZE, CELL_SIZE);
    ctx.strokeStyle = "#041e49";

    const rowSize = 800 / ROW;
    const dolSize = 10;

    for (let x = 0; x < ROW; x++) {
      for (let y = 0; y < ROW; y++) {
        ctx.strokeRect(rowSize * x + margin, rowSize * y + margin, rowSize, rowSize);
      }
    }

    // 별점 (star point) 그리기
    for (let a = 0; a < 3; a++) {
      for (let b = 0; b < 3; b++) {
        ctx.fillStyle = '#041e49';
        ctx.beginPath();
        ctx.arc(
          (3 + a * 6) * rowSize + margin,
          (3 + b * 6) * rowSize + margin,
          dolSize / 3,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    }
  };

  const drawStones = (ctx: CanvasRenderingContext2D) => {
    const cellSize = 800 / ROW;
    board.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell.ply !== 0) {
          ctx.beginPath();
          ctx.arc(x * cellSize + margin, y * cellSize + margin, STONE_RADIUS, 0, Math.PI * 2);
          ctx.fillStyle = cell.color;
          ctx.fill();
        }
      });
    });
  };

  const placeStone = () => {
    // 빈 함수로 두었습니다. handleClick 에서 돌을 놓도록 처리하고 있으므로,
    // placeStone 버튼을 별도로 눌러야 놓이는 로직으로 바꾸려면 여기를 구현해야 합니다.
  };

  // 방금 둔 돌에 사각형 표시 (현재는 사용되지 않음)
  const drawRect = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const w = CELL_SIZE / ROW;
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 3;
    ctx.strokeRect(
      x * w + margin - w / 2,
      y * w + margin - w / 2,
      w,
      w
    );
  };

  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left - margin + (800 / ROW) / 2) / (800 / ROW));
    const y = Math.floor((event.clientY - rect.top - margin + (800 / ROW) / 2) / (800 / ROW));

    if (x >= 0 && x < ROW && y >= 0 && y < ROW && board[y][x].ply === 0 && winner === null) {
      const newBoard = board.map(row => row.map(cell => ({ ...cell })));
      const currentPlayer = isBlackTurn ? 1 : 2;
      newBoard[y][x] = {
        ply: currentPlayer,
        color: selectedColors[currentPlayer === 1 ? 'P1' : 'P2']
      };
      setBoard(newBoard);

      setMoves(prev => [...prev, { x, y }]);
      if (checkWin(newBoard, x, y, currentPlayer)) {
        setWinner(currentPlayer);
      } else {
        setIsBlackTurn(!isBlackTurn);
      }
    }
  };

  const changeColorAndSize = ({ color, num }: { color: string; num: number }) => {
    setSelectedColors(prevColors => ({
      ...prevColors,
      [num === 1 ? 'P2' : 'P1']: color
    }));
  };

  const undoMove = () => {
    if (moves.length > 0 && winner === null) {
      const lastMove = moves[moves.length - 1];
      const newBoard = board.map(row => row.map(cell => ({ ...cell })));
      newBoard[lastMove.y][lastMove.x] = { ply: 0, color: '' };
      setBoard(newBoard);
      setMoves(prev => prev.slice(0, -1));
      setIsBlackTurn(prev => !prev);
    }
  };

  const checkWin = (
    board: { ply: number; color: string }[][],
    x: number,
    y: number,
    player: number
  ): boolean => {
    const directions = [
      { dx: 1, dy: 0 },   // 가로
      { dx: 0, dy: 1 },   // 세로
      { dx: 1, dy: 1 },   // 대각선 아래쪽
      { dx: 1, dy: -1 }   // 대각선 위쪽
    ];

    return directions.some(({ dx, dy }) => {
      let count = 1;
      // 정방향으로
      for (let i = 1; i < 5; i++) {
        const nx = x + dx * i;
        const ny = y + dy * i;
        if (
          nx >= 0 &&
          nx < ROW &&
          ny >= 0 &&
          ny < ROW &&
          board[ny][nx].ply === player
        ) {
          count++;
        } else {
          break;
        }
      }
      // 역방향으로
      for (let i = 1; i < 5; i++) {
        const nx = x - dx * i;
        const ny = y - dy * i;
        if (
          nx >= 0 &&
          nx < ROW &&
          ny >= 0 &&
          ny < ROW &&
          board[ny][nx].ply === player
        ) {
          count++;
        } else {
          break;
        }
      }
      return count >= 5;
    });
  };

  // -------------- 렌더링 파트 --------------
  return (
    <div className="BLindFiveMock">
      <section className={"Main"}>
        <div className={"GameName"}>{'Blind Five mok'}</div>
        <div className="Control">
          <div>
            <button onClick={undoMove} className={"Withdraw"}>{'무르기'}</button>
          </div>
          <div>
            <button
              className="Reload"
              onClick={() => {
                // 새로 시작: 보드와 상태, 타이머 모두 초기화
                setBoard(Array.from({ length: ROW }, () => Array(ROW).fill({ ply: 0, color: '' })));
                setIsBlackTurn(true);
                setMoves([]);
                setWinner(null);
                setTimeP1(180);
                setTimeP2(180);
              }}
            >{'다시하기'}</button>
          </div>
        </div>
      </section>

      <section className="PlayArea">
        {winner &&
          <div className={`WinShow ${winner === 1 ? 'Black' : 'White'}`}>
            {`Player${winner} 승리!`}
            <div className="Trophy">
              <img className={"TrophyImg"} src={"./trophy.png"} width={'200px'} height={'200px'} alt={""} />
            </div>
          </div>
        }

        <div className="CanvasContainer">
          <canvas
            ref={canvasRef}
            onClick={handleClick}
            width={CELL_SIZE}
            height={CELL_SIZE}
          />
        </div>

        {(['P1', 'P2'] as const).map((player, index) => (
          <div key={player} className={`PlayerArea ${player}`}>
            <div className={'Btns'}>
              {COLORS.map(color =>
                <button
                  key={color}
                  className={`ColorBtn ${color} ${selectedColors[player] === color ? 'Selected' : ''}`}
                  onClick={() => changeColorAndSize({ color, num: index })}
                />
              )}
              {/* 자신의 턴일 때만 ‘착수’ 버튼 노출 */}
              {(winner === null && (isBlackTurn ? index === 0 : index === 1)) && (
                <button
                  className={'PlaceStoneBtn'}
                  onClick={() => placeStone()}
                >
                  {'착수'}
                </button>
              )}
            </div>
            {/* 타이머 표시: MM:SS 형식 */}
            <div className={'Timer'}>
              {index === 0 ? formatTime(timeP1) : formatTime(timeP2)}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default BlindFiveOmok;
