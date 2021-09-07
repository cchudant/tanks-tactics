import styled from 'styled-components'

const tileSize = '52px'

type ReactMouseEvent = React.MouseEvent<HTMLDivElement, MouseEvent>

const identityFn = () => {}

export interface BoardEntity {
  x: number
  y: number
  display: JSX.Element
  key: string
}

const BoardContainer = styled.div<{ width: number; height: number }>`
  position: relative;
  display: flex;
  flex-direction: row;
`
const HorizontalBCtnr = styled.div<{}>`
  display: flex;
  flex-direction: row;
`

const RowCoords = styled.div<{}>`
  margin-left: ${tileSize};
  display: flex;
`
const ColCoords = styled.div<{}>``
const Coord = styled.div`
  width: ${tileSize};
  height: ${tileSize};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
`

const arrayTo = (n: number) =>
  Array(n)
    .fill(0)
    .map((_, i) => i)

const Tile = styled.div<{ x: number; y: number; boardFlipped?: boolean }>`
  width: ${tileSize};
  height: ${tileSize};
  background-color: white;
  border: 1px #8d8d8d solid;
  box-sizing: border-box;
`

const Sprite = styled.div<{
  entity: BoardEntity
  boardFlipped?: boolean
  boardHeight: number
}>`
  position: absolute;
  width: ${tileSize};
  height: ${tileSize};
  bottom: calc(${opt => !opt.boardFlipped ? opt.boardHeight - 1 - opt.entity.y : opt.entity.y} * ${tileSize});
  left: calc(${opt => opt.entity.x} * ${tileSize});
  display: flex;
  align-items: center;
  justify-content: center;
`

const RowNumToDisp = (v: number) => 'abcdefghijklmnopqrstuvwxyz'[v]
const ColNumToDisp = (v: number) => (v + 1).toString()

export function GameBoard({
  width,
  height,
  flipped,
  showCoords = false,
  entities,
  onEntityClick = identityFn,
  legend,
}: {
  width: number
  height: number
  flipped?: boolean
  showCoords?: boolean
  entities: BoardEntity[]
  onEntityClick?: (entity: BoardEntity, ev: ReactMouseEvent) => void
  legend?: JSX.Element
}) {
  const onClick = (x: number, y: number, ev: ReactMouseEvent) => {
    const entity = entities.find(ent => ent.x === x && ent.y === y)
    if (entity) onEntityClick(entity, ev)
  }

  return (
    <div>
      {showCoords ? (
        <RowCoords>
          {arrayTo(width).map(x => (
            <Coord key={x}>{RowNumToDisp(x)}</Coord>
          ))}
        </RowCoords>
      ) : null}
      <HorizontalBCtnr>
        {showCoords ? (
          <ColCoords>
            {arrayTo(height).map(y => (
              <Coord key={y}>
                {ColNumToDisp(!flipped ? y : height - y - 1)}
              </Coord>
            ))}
          </ColCoords>
        ) : null}
        <BoardContainer width={width} height={height}>
          {arrayTo(width).map(x => (
            <div key={x}>
              {arrayTo(height).map(y => (
                <Tile
                  key={y * width + x}
                  x={x}
                  y={y}
                  boardFlipped={flipped}
                  onClick={ev => onClick(x, y, ev)}
                />
              ))}
            </div>
          ))}
          {entities.map(e => (
            <Sprite
              entity={e}
              boardFlipped={flipped}
              boardHeight={height}
              key={e.key}
            >
              {e.display}
            </Sprite>
          ))}
        </BoardContainer>
        {legend || null}
      </HorizontalBCtnr>
    </div>
  )
}
