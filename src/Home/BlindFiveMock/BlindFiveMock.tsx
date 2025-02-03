import React, { useEffect, useRef, useState } from "react";
import './style.scss'
import './win.scss'
import './playerArea.scss'

const margin = 30;
const ROW = 18 // 바둑판 선 개수
const STONE_RADIUS = 19; // 바둑돌 크기
const COLORS = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'];
const CELL_SIZE = 800 + margin*2; // 바둑판 한 칸 크기

const BlindFiveOmok: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [board, setBoard] = useState<{ ply: number; color: string }[][]>(Array.from({ length: ROW }, () => Array(ROW).fill({ ply: 0, color: '' })));
    const [isBlackTurn, setIsBlackTurn] = useState(true);
    const [moves, setMoves] = useState<{ x: number; y: number }[]>([]);
    const [selectedColors, setSelectedColors] = useState<{ P1: string; P2: string }>({ P1: 'red', P2: 'red' });
    const [winner, setWinner] = useState<number|null>(null);
    const [prevRect, setPrevRect] = useState(null); // 이전에 그려진 네모의 위치를 저장하는 변수

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

        // Draw star points
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
  
    const placeStone = () => {}
    
    ////////////사각표시 안됨
    // 방금 둔 바둑돌에 사각 표시
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
        if (x >= 0 && x < ROW && y >= 0 && y < ROW && board[y][x].ply === 0) {
            const newBoard = board.map(row => [...row]);
            const currentPlayer = isBlackTurn ? 1 : 2;
            newBoard[y][x] = {ply: currentPlayer, color: selectedColors[currentPlayer === 1 ? 'P1' : 'P2']};
            setBoard(newBoard);

            setMoves([...moves, { x, y }]);
            if (checkWin(newBoard, x, y, currentPlayer)) {
                console.log('Player', currentPlayer, 'wins!');
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
    }

    const undoMove = () => {
        if (moves.length > 0) {
        const lastMove = moves[moves.length - 1];
        const newBoard = board.map(row => [...row]);
        newBoard[lastMove.y][lastMove.x] = { ply: 0, color: '' };
        setBoard(newBoard);
        setMoves(moves.slice(0, -1));
        setIsBlackTurn(!isBlackTurn);
        }
    };

    const checkWin = (board: { ply: number; color: string }[][], x: number, y: number, player: number): boolean => {
        const directions = [
            { dx: 1, dy: 0 }, // Horizontal
            { dx: 0, dy: 1 }, // Vertical
            { dx: 1, dy: 1 }, // Diagonal down-right
            { dx: 1, dy: -1 } // Diagonal up-right
        ];

        return directions.some(({ dx, dy }) => {
            let count = 1;

            for (let i = 1; i < 5; i++) {
                const nx = x + dx * i;
                const ny = y + dy * i;
                if (nx >= 0 && nx < ROW && ny >= 0 && ny < ROW && board[ny][nx].ply === player) {
                    count++;
                } else {
                    break;
                }
            }

            for (let i = 1; i < 5; i++) {
                const nx = x - dx * i;
                const ny = y - dy * i;
                if (nx >= 0 && nx < ROW && ny >= 0 && ny < ROW && board[ny][nx].ply === player) {
                    count++;
                } else {
                    break;
                }
            }

            return count >= 5;
        });
    };

    useEffect(() => {
        if (moves.length > 0) {
        const lastMove = moves[moves.length - 1];
        const player = isBlackTurn ? 2 : 1;
        if (checkWin(board, lastMove.x, lastMove.y, player)) {
            setWinner(player);
        }
        }
    }, [moves]);

  return (
    <div className="BLindFiveMock">
        <section className={"Main"}>
            <div className={"GameName"} >{'Blind Five mok'}</div>
            <div className="Control">
                <div>
                    <button onClick={undoMove} className={"Withdraw"}>{'무르기'}</button>
                </div>
                <div>
                    <button className="Reload">{'다시하기'}</button>
                </div>
            </div>
        <section/>

        <section className="PlayArea">
            { winner &&
              <div className={`WinShow ${winner===1 ? 'Black' : 'White'}`}>{`Player${winner} 승리!`}
                  <div className="Trophy">
                      <img className={"TrophyImg"} src={"./trophy.png"} width={'200px'} height={'200px'} alt={""}/>
                  </div>
              </div>
            }

            <div className="CanvasContainer">
                <canvas ref={canvasRef} onClick={handleClick} width={CELL_SIZE} height={CELL_SIZE}/>
            </div>
            
            {(['P1', 'P2'] as const).map((player, index) => (
            <div key={player} className={`PlayerArea ${player}`}>
                <div className={'Btns'}>
                    {COLORS.map(color => 
                    <button 
                    key={color} 
                    className={`ColorBtn ${color} ${selectedColors[player] === color ? 'Selected' : ''}`} 
                    onClick={() => changeColorAndSize({ color, num: index })}
                    >
                    </button>
                    )}
                    <button className={'PlaceStoneBtn'} onClick={() => placeStone()}>{'착수'}</button>
                </div>
                <div className={'Timer'}>3:00</div>
            </div>
            ))}
        <section/>
        </section>
        </section>
      </div>
    )
}

export default BlindFiveOmok;