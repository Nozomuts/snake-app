import React, { useCallback, useEffect, useRef, useState } from "react";
import { Navigation } from "./components/Navigation";
import { Field } from "./components/Field";
import { Button } from "./components/Button";
import { ManipulationPanel } from "./components/ManipulationPanel";
import { initFields, getFoodPosition } from "./utils";
import { IDirection, IPosition, IStatus } from "./utils/types";

const initialPosition = { x: 17, y: 17 };
const initialValues = initFields(35, initialPosition);
const isCollision = (fieldSize: number, position: IPosition) => {
  if (position.y < 0 || position.x < 0) {
    return true;
  }

  if (position.y > fieldSize - 1 || position.x > fieldSize - 1) {
    return true;
  }

  return false;
};

initialValues[9][9] = "food";
const defaultDifficulty = 3;
const Difficulty = [1000, 500, 100, 50, 10];

const GameStatus = {
  init: "init",
  playing: "playing",
  suspended: "suspended",
  gameover: "gameover",
} as const;

const Direction = {
  up: "up",
  right: "right",
  left: "left",
  down: "down",
} as const;

const OppositeDirection = {
  up: "down",
  right: "left",
  left: "right",
  down: "up",
} as const;

const Delta = {
  up: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
  left: { x: -1, y: 0 },
  down: { x: 0, y: 1 },
} as const;

const DirectionKeyCodeMap = {
  37: Direction.left,
  38: Direction.up,
  39: Direction.right,
  40: Direction.down,
} as const;

const isEatingMyself = (fields: any, position: any) => {
  return fields[position.y][position.x] === "snake";
};

function App() {
  const [fields, setFields] = useState(initialValues);
  const [tick, setTick] = useState(0);
  const [direction, setDirection] = useState<IDirection>(Direction.up);
  const [body, setBody] = useState<IPosition[]>([]);
  const [status, setStatus] = useState<IStatus>(GameStatus.init);
  const [difficulty, setDifficulty] = useState(defaultDifficulty);

  const timer = useRef<NodeJS.Timeout>();

  const unsubscribe = () => {
    if (!timer) {
      return;
    }
    clearInterval(timer.current as number | undefined);
  };

  useEffect(() => {
    setBody([initialPosition]);
    const interval = Difficulty[difficulty - 1];
    timer.current = setInterval(() => {
      setTick((tick) => tick + 1);
    }, interval);
    return unsubscribe;
  }, [difficulty]);

  useEffect(() => {
    if (body.length === 0 || status !== GameStatus.playing) {
      return;
    }
    const canContinue = handleMoving();
    if (!canContinue) {
      setStatus(GameStatus.gameover);
    }
  }, [tick]);

  const onStart = () => setStatus(GameStatus.playing);

  const onRestart = () => {
    timer.current = setInterval(() => {
      setTick((tick) => tick + 1);
    }, Difficulty[difficulty - 1]);
    setDirection(Direction.up);
    setStatus(GameStatus.init);
    setBody([initialPosition]);
    setFields(initFields(35, initialPosition));
  };

  const onStop = () => setStatus(GameStatus.suspended);

  const onChangeDirection = useCallback(
    (newDirection: IDirection) => {
      if (status !== GameStatus.playing) {
        return direction;
      }
      if (OppositeDirection[direction] === newDirection) {
        return;
      }
      setDirection(newDirection);
    },
    [direction, status]
  );

  const onChangeDifficulty = useCallback(
    (difficulty) => {
      if (status !== GameStatus.init) {
        return;
      }
      if (difficulty < 1 || difficulty > Difficulty.length) {
        return;
      }
      setDifficulty(difficulty);
    },
    [status]
  );

  useEffect(() => {
    const handleKeyDown = (e: any) => {
      const newDirection =
        DirectionKeyCodeMap[e.keyCode as "37" | "38" | "39" | "40"];
      if (!newDirection) {
        return;
      }

      onChangeDirection(newDirection);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onChangeDirection]);

  const handleMoving = () => {
    const { x, y } = body[0];
    const delta = Delta[direction];
    const newPosition = {
      x: x + delta.x,
      y: y + delta.y,
    };
    if (
      isCollision(fields.length, newPosition) ||
      isEatingMyself(fields, newPosition)
    ) {
      return false;
    }
    const newBody = [...body];
    if (fields[newPosition.y][newPosition.x] !== "food") {
      const removingTrack = newBody.pop();
      fields[removingTrack!.y][removingTrack!.x] = "";
    } else {
      const food = getFoodPosition(fields.length, [...newBody, newPosition]);
      fields[food.y][food.x] = "food";
    }
    fields[newPosition.y][newPosition.x] = "snake";
    newBody.unshift(newPosition);
    setBody(newBody);
    setFields(fields);
    return true;
  };

  return (
    <div className="App">
      <header className="header">
        <div className="title-container">
          <h1 className="title">Snake Game</h1>
        </div>
        <Navigation
          length={body.length}
          difficulty={difficulty}
          onChangeDifficulty={onChangeDifficulty}
        />
      </header>
      <main className="main">
        <Field fields={fields} />
      </main>
      <footer className="footer">
        <Button
          status={status}
          onStop={onStop}
          onStart={onStart}
          onRestart={onRestart}
        />
        <ManipulationPanel onChange={onChangeDirection} />
      </footer>
    </div>
  );
}

export default App;