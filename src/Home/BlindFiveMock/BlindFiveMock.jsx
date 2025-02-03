let p1Color = 'red';
let p2Color = 'red';
let selectedPosition = null;
let prevRect = null; // 이전에 그려진 네모의 위치를 저장하는 변수


window.onload = function () {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    const margin = 30;
    const cw = (ch = canvas.width = canvas.height = 800 + margin * 2);
    const row = 18; // 바둑판 선 개수
    const rowSize = 800 / row; // 바둑판 한 칸의 너비
    const dolSize = 19;  // 바둑돌 크기
    let count = 0;
    let msg = document.querySelector('.message');
    let btn1 = document.querySelector('#reload');
    let btn2 = document.querySelector('#withdraw');
    let board = new Array(Math.pow(row + 1, 2)).fill(-1); // 144개의 배열을 생성해서 -1로 채움
    let showboard = new Array(Math.pow(row + 1, 2)).fill(-1);
    let colors = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'];
    let history = new Array();
    let checkDirection = [
      [1, -1],
      [1, 0],
      [1, 1],
      [0, 1],
      [-1, 1],
      [-1, 0],
      [-1, -1],
      [0, -1],
    ];
    const blackWinScreen = document.querySelector('.winShow1');
    const whiteWinScreen = document.querySelector('.winShow2');
    switchToPlayer1Turn();
    startTimer();

    let timer1 = 180;
    let timer2 = 180;

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    }

    // '한판 더' 버튼 누르면, 페이지 reload
    btn1.addEventListener('mouseup', () => {
      setTimeout(() => {
        location.reload();
      }, 2000);
    });
    // 무르기 버튼 누르면, withdraw() 함수 실행
    btn2.addEventListener('mouseup', () => {
      withdraw();
    });
  
    draw(); // 시작하면서 빈 바둑판 그리기
  
    function startTimer() {
      // 1초마다 타이머를 감소시키는 setInterval
      const timerId = setInterval(function () {
        if (count != 0) {
          // 현재 플레이어가 1일 때
          if (count%2 == 0) {
            // 플레이어 1의 타이머를 감소하고 화면에 표시
            timer1--;
            document.getElementById('timer1').innerHTML = formatTime(timer1);
            // 플레이어 1의 타이머가 0이 되면 게임 종료
            if (timer1 === 0) {
                clearInterval(timerId);
                winShow(2);
            }
        } else { // 현재 플레이어가 2일 때
            // 플레이어 2의 타이머를 감소하고 화면에 표시
            timer2--;
            document.getElementById('timer2').innerHTML = formatTime(timer2);
            // 플레이어 2의 타이머가 0이 되면 게임 종료
            if (timer2 === 0) {
                clearInterval(timerId);
                winShow(1);
            }
        }
        }
      }, 1000);
    }

    // x,y 좌표를 배열의 index값으로 변환
    let xyToIndex = (x, y) => {
      return x + y * (row + 1);
    };
  
    // 배열 index값을 x,y좌표로 변환
    let indexToXy = (i) => {
      w = Math.sqrt(board.length);
      x = i % w;
      y = Math.floor(i / w);
      return [x, y];
    };
  
    // 바둑판 그리기 함수
    function draw() {
      ctx.fillStyle = '#d3e3fd';
      ctx.fillRect(0, 0, cw, ch);
      for (let x = 0; x < row; x++) {
        for (let y = 0; y < row; y++) {
          let w = (cw - margin * 2) / row;
          ctx.strokeStyle = '#041e49';
          ctx.lineWidth = 1;
          ctx.strokeRect(w * x + margin, w * y + margin, w, w);
        }
      }
  
      // 화점에 점 찍기
      for (let a = 0; a < 3; a++) {
        for (let b = 0; b < 3; b++) {
          ctx.fillStyle = '#041e49';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(
            (3 + a) * rowSize + margin + a * 5 * rowSize,
            (3 + b) * rowSize + margin + b * 5 * rowSize,
            dolSize / 3,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }
    }
  
    // 방금 둔 바둑돌에 사각 표시
    drawRect = (x, y) => {
      let w = rowSize/2;
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 3;
      ctx.strokeRect(
        x * rowSize + margin - w,
        y * rowSize + margin - w,
        w + rowSize/2,
        w + rowSize/2
      );
    };
    
    //바둑알 그리기. 실제로는 바둑판까지 매번 통째로 그려줌
    drawCircle = (x, y) => {
      draw();
      for (i = 0; i < board.length; i++) { // 모든 눈금의 돌의 유무,색깔 알아내기
        let a = indexToXy(i)[0];
        let b = indexToXy(i)[1];
  
        if (board[xyToIndex(a, b)] == 1) { // Player1(흑)
          ctx.fillStyle = showboard[xyToIndex(a, b)];
          ctx.beginPath();
          ctx.arc(
            a * rowSize + margin,
            b * rowSize + margin,
            dolSize,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
        if (board[xyToIndex(a, b)] == 2) { // Player2(백)
          ctx.fillStyle = showboard[xyToIndex(a, b)];
          ctx.beginPath();
          ctx.arc(
            a * rowSize + margin,
            b * rowSize + margin,
            dolSize,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }
  
      checkWin(x, y); // 돌이 5개 연속 놓였는지 확인 함수 실행
  
      let boardCopy = Object.assign([], board);
      history.push(boardCopy); //무르기를 위해서 판 전체 모양을 배열에 입력
    };
  
    // 물르기 함수
    withdraw = () => {
      history.pop(); // 무르면서 가장 최근 바둑판 모양은 날려버림
      lastBoard = history.slice(-1)[0]; // 바둑판 마지막 모양
      board = lastBoard;
      count--; // 흑,백 차례를 한 수 뒤로 물림
  
      draw();
  
      // 직전 판의 모양으로 바둑판 다시 그리기
      for (i = 0; i < lastBoard.length; i++) {
        let a = indexToXy(i)[0];
        let b = indexToXy(i)[1];
  
        if (lastBoard[xyToIndex(a, b)] == 1) { // 흑
          ctx.fillStyle = showboard[xyToIndex];
          ctx.beginPath();
          ctx.arc(
            a * rowSize + margin,
            b * rowSize + margin,
            dolSize,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
        if (lastBoard[xyToIndex(a, b)] == 2) { // 백
          ctx.fillStyle = showboard[xyToIndex];
          ctx.beginPath();
          ctx.arc(
            a * rowSize + margin,
            b * rowSize + margin,
            dolSize,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }
    };

    // 승패 판정 함수
    function checkWin(x, y) {
      let thisColor = board[xyToIndex(x, y)]; // 마지막 둔 돌의 색깔이 1(흑),2(백)인지...
      //가로,세로와 대각선 두 방향, 총 네 방향 체크
      for (k = 0; k < 4; k++) {
        winBlack = 1;   winWhite = 1;
        // 놓여진 돌의 양쪽 방향으로
        for (j = 0; j < 2; j++) {
          // 5개씩의 돌의 색깔을 확인
          for (i = 1; i < 5; i++) {
            let a = x + checkDirection[k + 4 * j][0] * i;
            let b = y + checkDirection[k + 4 * j][1] * i;
            if (board[xyToIndex(a, b)] == thisColor) {
              // 색깔에 따라서 흑,백의 숫자를 하나씩 증가
              switch (thisColor) {
                case 1: winBlack++; break;
                case 2: winWhite++; break;
              }
            } else { break; }
          }
        }
        // 연속 돌이 5개이면 승리
        if (winBlack == 5) {winShow(1);}
        if (winWhite == 5) {winShow(2);}
      }
    } // 승리확인 함수 끝
  
    // 승리 화면 표시
    function winShow(x) {
        // showOriginal();
        // 모든 돌의 색을 검정 또는 하얀색으로 변경
        for (let i = 0; i < board.length; i++) {
          let a = indexToXy(i)[0];
          let b = indexToXy(i)[1];

          if (board[xyToIndex(a, b)] == 1) { // Player1(흑)
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(
              a * rowSize + margin,
              b * rowSize + margin,
              dolSize,
              0,
              Math.PI * 2
            );
            ctx.fill();
          }
          if (board[xyToIndex(a, b)] == 2) { // Player2(백)
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(
              a * rowSize + margin,
              b * rowSize + margin,
              dolSize,
              0,
              Math.PI * 2
            );
            ctx.fill();
          }
        }
      switch (x) {
        case 1:
          // 음악이 재생되도록 약간의 시차를 두고 화면 표시
          setTimeout(() => {
            blackWinScreen.style.visibility = 'visible';
            blackWinScreen.style.zIndex = 2;
            const troImg = document.querySelector('#trophyImg');
            troImg.style.animationName = 'trophy';
          }, 300);
          break;
        case 2:
          // 음악이 재생되도록 약간의 시차를 두고 화면 표시
          setTimeout(() => {
            whiteWinScreen.style.visibility = 'visible';
            whiteWinScreen.style.zIndex = 2;
            const troImg = document.querySelector('#trophyImg2');
            troImg.style.animationName = 'trophy';
          }, 300);
          break;
      }
      count = 0;
      document.getElementById('score').innerHTML = 'score:'+(180-timer1+timer2);
    }

    document.addEventListener('mouseup', (e) => {
      if (e.target.id == 'canvas') {
        let x = Math.round(Math.abs(e.offsetX - margin) / rowSize);
        let y = Math.round(Math.abs(e.offsetY - margin) / rowSize);
        console.log(e.offsetX, e.offsetY, x, y);
        if (
          e.offsetX > 10 &&
          e.offsetX < 840 &&
          e.offsetY > 10 &&
          e.offsetY < 840
        ) {
          if (board[xyToIndex(x, y)] != -1) {
            // 이미 돌이 놓여진 자리이면 아무것도 하지 않음
          } else {
            // 비어있는 자리이면, 사용자가 클릭한 위치를 저장
            selectedPosition = { x, y };
            drawCircle(x, y);
            drawRect(x, y);
          }

          const placeStoneButton1 = document.querySelector('#place-stone-button1');
          const placeStoneButton2 = document.querySelector('#place-stone-button2');
          placeStoneButton1.addEventListener('click', () => {
            if (selectedPosition) {
              let x = selectedPosition.x;
              let y = selectedPosition.y;
              if (count % 2 == 0){
                board[xyToIndex(x, y)] = 1;
                showboard[xyToIndex(x,y)] = p1Color;
                switchToPlayer2Turn();
              }
              else {
                board[xyToIndex(x, y)] = 2;
                showboard[xyToIndex(x,y)] = p2Color;
                switchToPlayer1Turn();
              }
              count++;
              console.log(count, p1Color, p2Color);
              console.log(board);
              console.log(showboard);
              drawCircle(x, y);

              if (count % 10 === 0) {
                var canvasContainer = document.getElementById('canvasContainer');
                rotateDegree += 90;
                canvasContainer.style.transform = "rotate(" + rotateDegree + "deg)";
              }

              // 돌을 놓았으므로 선택한 위치를 초기화
              selectedPosition = null;
            }
          });
          
          placeStoneButton2.addEventListener('click', () => {
            if (selectedPosition) {
              let x = selectedPosition.x;
              let y = selectedPosition.y;
              if (count % 2 == 0){
                board[xyToIndex(x, y)] = 1;
                showboard[xyToIndex(x,y)] = p1Color;
                switchToPlayer2Turn();
              }
              else {
                board[xyToIndex(x, y)] = 2;
                showboard[xyToIndex(x,y)] = p2Color;
                switchToPlayer1Turn();
              }
              count++;
              console.log(count, p1Color, p2Color);
              console.log(board);
              console.log(showboard);
              drawCircle(x, y);

              if (count % 10 === 0) {
                var canvasContainer = document.getElementById('canvasContainer');
                rotateDegree += 90;
                canvasContainer.style.transform = "rotate(" + rotateDegree + "deg)";
              }

              // 돌을 놓았으므로 선택한 위치를 초기화
              selectedPosition = null;
            }
          });

        }
      }
      
    });
    var rotateDegree = 0;


  };

  function changeColorAndSize(color, n) {
    // 이전에 하이라이트된 버튼 찾아 스타일 원복
    const highlightedButtons = document.querySelectorAll(".highlight-button");
    for (const highlightedButton of highlightedButtons) {
        highlightedButton.style.backgroundColor = "";
        highlightedButton.classList.remove("highlight-button");
    }

    // 현재 버튼 찾기
    const button = document.querySelectorAll("." + color)[n];
    if (n==0) p1Color = color;
    else p2Color = color;

    // 로그에 현재 플레이어와 컬러 정보 출력
    console.log("Player:", n+1, "Color:", (n === 0) ? p1Color : p2Color);
    // 현재 버튼 스타일 변경
    button.classList.add("highlight-button");
}

function hidePlayer1Buttons() {
    const player1Buttons = document.querySelectorAll(".Player1 button");
    for (const button of player1Buttons) {
        button.style.display = "none";  // Player1 버튼 숨기기
    }
}

function hidePlayer2Buttons() {
    const player2Buttons = document.querySelectorAll(".Player2 button");
    for (const button of player2Buttons) {
        button.style.display = "none";  // Player2 버튼 숨기기
    }
}

function showPlayer1Buttons() {
    const player1Buttons = document.querySelectorAll(".Player1 button");
    for (const button of player1Buttons) {
        button.style.display = "block";  // Player1 버튼 나타내기
    }
    // 하이라이트 표시
    const button = document.querySelectorAll("." + p1Color)[0];
    button.classList.add("highlight-button");
}

function showPlayer2Buttons() {
    const player2Buttons = document.querySelectorAll(".Player2 button");
    for (const button of player2Buttons) {
        button.style.display = "block";  // Player2 버튼 나타내기
    }
    // 하이라이트 표시
    const button = document.querySelectorAll("." + p2Color)[1];
    button.classList.add("highlight-button");
}

// Player2 차례에 Player1 버튼 숨기고 Player2 버튼 나타내기
function switchToPlayer2Turn() {
    hidePlayer1Buttons();  // Player1 버튼 숨기기
    showPlayer2Buttons();  // Player2 버튼 나타내기
}

// Player1 차례에 Player2 버튼 숨기고 Player1 버튼 나타내기
function switchToPlayer1Turn() {
    hidePlayer2Buttons();  // Player2 버튼 숨기기
    showPlayer1Buttons();  // Player1 버튼 나타내기
}

// 시작하기 버튼 가져오기
const startButton = document.getElementById('startButton');

// 시작하기 버튼 클릭 이벤트 처리
startButton.addEventListener('click', () => {
    // 게임 시작
    startGame();
});

// 게임 시작 함수
function startGame() {
    // Player1 타이머 시작
    startTimer(player1, timer1, 'timer1');
}

const BlindFiveMock = () => {
   return (
      <>
         <section id="main">
               <div className="mainName" style={{ fontFamily: 'Kdam Thmor Pro', fontSize: '30px', marginLeft: '100px', marginTop: '45%' }}>Blind Five mok</div>
               <div className="buttons">
                  <div>
                     <button id="withdraw">무르기</button>
                  </div>
                  <div>
                     <button id="reload">다시하기</button>
                  </div>
               </div>
               {/* <button id="startButton" onClick={startTimer}>시작하기</button> */}
         </section>
         <section id="game">
               <div className="winShow1">Player1 승리! {/*검정*/}
                  <div className="trophy">
                     <img id="trophyImg" src="trophy.png" width="300px" height="300px" alt="" />
                  </div>
               </div>
               <div className="winShow2">Player2 승리! {/*흰색*/}
                  <div className="trophy">
                     <img id="trophyImg2" src="trophy.png" width="300px" height="300px" alt="" />
                     <div className="score" id="score"></div>
                  </div>
               </div>
               <div id="canvasContainer">
                  <canvas id="canvas"></canvas>
               </div>
               <div>
                  <div className="timer" id="timer1">3:00</div>
                  <div className="timer" id="timer2">3:00</div>
                  <div className="Player1">
                     <button id="place-stone-button1">착수</button>
                     <button className="red" onClick={() => changeColorAndSize('red', 0)}></button>
                     <button className="orange" onClick={() => changeColorAndSize('orange', 0)}></button>
                     <button className="yellow" onClick={() => changeColorAndSize('yellow', 0)}></button>
                     <button className="green" onClick={() => changeColorAndSize('green', 0)}></button>
                     <button className="blue" onClick={() => changeColorAndSize('blue', 0)}></button>
                     <button className="purple" onClick={() => changeColorAndSize('purple', 0)}></button>
                     <button className="pink" onClick={() => changeColorAndSize('pink', 0)}></button>
                  </div>
                  <div className="Player2">
                     <button id="place-stone-button2">착수</button>
                     <button className="red" onClick={() => changeColorAndSize('red', 1)}></button>
                     <button className="orange" onClick={() => changeColorAndSize('orange', 1)}></button>
                     <button className="yellow" onClick={() => changeColorAndSize('yellow', 1)}></button>
                     <button className="green" onClick={() => changeColorAndSize('green', 1)}></button>
                     <button className="blue" onClick={() => changeColorAndSize('blue', 1)}></button>
                     <button className="purple" onClick={() => changeColorAndSize('purple', 1)}></button>
                     <button className="pink" onClick={() => changeColorAndSize('pink', 1)}></button>
                  </div>
                  <div id="turn"></div>
               </div>
         </section>
      </>
    )
}

export default BlindFiveMock;