function Tile({ type, hasPlayer }) {
  return (
    <div className={`tile ${type}`}>
      {hasPlayer && <div className="player"></div>}
    </div>
  );
}

export default Tile;