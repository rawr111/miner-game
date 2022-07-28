import { useState, useEffect, useReducer } from 'react';

const reducer = (state, action) => {
    let newState = { ...state };
    let i = (action.id - action.id % state.size) / state.size;
    let j = action.id % state.size;

    const openCell = (i, j, id) => { 
        if (!state.play) return state;
        if (newState.field[i][j].isFlag) return state;
        if (state.isFirstClick) {
            newState.isFirstClick = false;
            let field;
            while (true) {
                console.log(`генерируем поле...`);
                field = generateFieldData(state.size, state.mineNumber);
                if (field[i][j].bombsAround === 0 && !field[i][j].isBomb){
                    break;
                }
            }
            newState.field = field;
            openCellsAround(i, j);
        }
        if (newState.field[i][j].isBomb) {
            alert('ТЫ ПРОИГРАЛ!');
            for (var k in newState.field) {
                for (var l in newState.field[k]) {
                    newState.field[k][l].isOpen = true;
                }
            }
            newState.play = false;
        }
        newState.field[i][j] = { ...newState.field[i][j], ...{ isOpen: true } };
    }

    const setFlag = () => {
        if (!state.play) return state;
        if (newState.field[i][j].isOpen) return state;
        if (action.isFlag){
            newState.leftMines -= 1;
        } else {
            newState.leftMines += 1;
        }
        
        newState.field[i][j] = { ...newState.field[i][j], ...{ isFlag: action.isFlag } };
    }

    const openCellsAround = (i, j) => {
        if (!state.play) return state;
        for (var k = i - 1; k <= i + 1; k++) {
            for (var l = j - 1; l <= j + 1; l++) {
                if (k === i && l === j || k < 0 || l < 0 || k >= newState.size || l >= newState.size) continue;
                if (newState.field[k] && newState.field[k][l]) {
                    if (newState.field[k][l].isOpen || newState.field[k][l].isFlag) continue;
                    newState.field[k][l].isOpen = true;
                    if (newState.field[k][l].bombsAround === 0) {
                        openCellsAround(k, l);
                    }
                }
            }
        }
    }

    switch (action.type) {
        case "GENERATE_NEW_FIELD":
            return { ...state, play: true, isFirstClick: true, field: generateFieldData(state.size, state.mineNumber) };
        case "SET_FLAG":
            setFlag();
            return newState;
        case "OPEN_CELL":
            openCell(i, j, action.id);
            return newState;
        case "OPEN_CELLS_AROUND":
            openCellsAround(i, j);
            return newState;
        case "OPEN_ALL":
            if (!state.play) return state;
            for (var k in newState.field) {
                for (var l in newState.field[k]) {
                    newState.field[k][l].isOpen = true;
                }
            }
            return newState;
        case "SET_PLAY":
            return { ...state, play: action.play };
        case "CHANGE_FIELD_PROPERTY":
            return {...state, ...action.content };
    }
    return state;
}

const Game = () => {
    const defaultSize = 15;
    const defaultMineNumber = 40;

    const [state, dispatch] = useReducer(reducer, { play: true, size: defaultSize, isFirstClick: true, mineNumber: defaultMineNumber, leftMines: defaultMineNumber, field: [] });
    
    const checkWin = () => {
        if (!state.play) return;
        let openCellsNumber = 0;
        for (var raw of state.field) {
            for (var cell of raw) {
                if (cell.isOpen) openCellsNumber += 1;
            }
        }
        if (openCellsNumber === state.size * state.size - state.mineNumber) {
            alert('ТЫ ПОБЕДИЛ! МУЖИИИК');
            dispatch({ type: 'OPEN_ALL' });
            dispatch({ type: 'SET_PLAY', play: false })
        }
    }

    useEffect(() => {
        checkWin();
    });

    useEffect(() => {
        dispatch({ type: 'GENERATE_NEW_FIELD' });
    }, []);

    return (<>
        <div className="caption">САПЁР ^-^</div>
        <div className='game-settings'>
            <div className=''>Размер поля: <input type="number" value={state.size} onChange={(e) => {
                dispatch({ type: 'CHANGE_FIELD_PROPERTY', content: { size: e.target.value }});
            }} /></div>
            <div>Количество мин: <input type="number" value={state.mineNumber} onChange={(e) => {
                dispatch({ type: 'CHANGE_FIELD_PROPERTY', content: { mineNumber: e.target.value } });
            }} /></div>
            <div className='reset-btn' onClick={() => {
                if (state.mineNumber > state.size * state.size) {
                    return alert(`Количество мин больше, чем размер поля!`);
                }
                if (state.mineNumber < 0 || state.size <= 0 || !state.mineNumber || !state.size) {
                    return alert(`Некорректное количество мин или размер поля!`);
                }
                if (state.size <= 3){
                    dispatch({ type: 'CHANGE_FIELD_PROPERTY', content: { size: defaultSize } });
                    return alert(`Сделай размер поля больше, чем 3!!!`);
                }
                if (state.mineNumber < 10){
                    dispatch({ type: 'CHANGE_FIELD_PROPERTY', content: { mineNumber: defaultMineNumber, leftMines: defaultMineNumber } });
                    return alert(`10 мин - минимум`);
                }
                dispatch({ type: 'CHANGE_FIELD_PROPERTY', content: { leftMines: state.mineNumber } });
                dispatch({ type: 'GENERATE_NEW_FIELD' });
            }}>Начать заново</div>
        </div>
        <div className="game-field">
            {state.field.map((row, i) => {
                return <div key={i} className='row'>{row.map((cell, j) => {
                    return <Cell play={state.play} state={state} dispatch={dispatch} key={i * state.size + j} id={i * state.size + j} {...cell}></Cell>;
                })}</div>;
            })}
        </div>
        <div className='game-info'>
            <div>Мин осталось: {state.leftMines >= 0 ? state.leftMines : 0}</div>
        </div>
    </>);
}

const Cell = (props) => {
    const { id, play, state, dispatch, bombsAround, isOpen, isBomb, isFlag } = props;

    return (
        <div className={isFlag ? 'cell-flag' : isOpen ? 'cell-open' : 'cell'}
            onContextMenu={(e) => {
                e.preventDefault()
                dispatch({ type: 'SET_FLAG', id: props.id, isFlag: !isFlag });
            }}
            onClick={(e) => {
                if (!play) {
                    return alert(`Чел, игра окончена, нажми кнопку НАЧАТЬ ЗАНОВО`);
                }
                if (props.bombsAround === 0 && !isBomb) {
                    dispatch({ type: 'OPEN_CELLS_AROUND', id: props.id });
                }
                dispatch({ type: 'OPEN_CELL', id: props.id, isOpen: true });
                
            }}>
            <div className='cell-content'>{isOpen ? props.isBomb ? 'B' : String(bombsAround) : ''}</div>
        </div>
    );
}

const random = (max) => {
    const rand = Math.random();
    return (rand * max).toFixed() / 1;
}

const generateRandomNumbers = (max, number) => {
    var randomNumbers = [];
    var count = 0;

    while (count != number) {
        const rand = random(max);
        if (!randomNumbers.includes(rand)) {
            randomNumbers.push(rand);
            count += 1;
        }
    }
    return randomNumbers;
}

const generateFieldData = (size, mineNumber) => {
    const bombsIndexes = generateRandomNumbers(size * size, mineNumber);
    var field = [];
    for (var i = 0; i < size; i++) {
        field.push([]);
        for (var j = 0; j < size; j++) {
            field[i].push({
                isBomb: bombsIndexes.includes(i * size + j),
                isFlag: false,
                isOpen: false
            });
        }
    }
    for (var i = 0; i < size; i++) {
        for (var j = 0; j < size; j++) {
            let bombsAround = 0;
            for (var k = i - 1; k <= i + 1; k++) {
                for (var l = j - 1; l <= j + 1; l++) {
                    if (k === i && l === j || k < 0 || l < 0 || k >= size || l >= size) continue;
                    const cell = field[k][l];
                    if (cell && cell.isBomb) {
                        bombsAround += 1;
                    }
                }
            }
            field[i][j].bombsAround = bombsAround;
        }
    }
    return field;
}

export default Game;