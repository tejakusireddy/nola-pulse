import Image from "next/image";
import photos from "../data/venue-assets.json";
import { gameDate, gameTime } from "../lib/format";
import type { Game } from "../lib/brief";

export default function VenueContext({ game }: { game: Game }) {
  const saints = game.franchise === "Saints";
  const photo = photos[saints ? "Saints" : "Pelicans"];
  return (
    <div className="venue-context">
      <figure>
        <Image
          unoptimized
          src={photo.path}
          alt={photo.alt}
          width={1280}
          height={saints ? 999 : 720}
        />
        <figcaption>
          <span>HOME GAME IN FOCUS</span>
          <strong>
            {game.franchise} vs. {game.opponent}
          </strong>
          <p>
            {gameDate(game.starts_at)} · {gameTime(game.starts_at)}
          </p>
        </figcaption>
      </figure>
      <div className="venue-credit">
        <span>{game.venue}</span>
        <small>
          <a href={photo.source_url} target="_blank" rel="noreferrer">
            {photo.author}
          </a>{" "}
          ·{" "}
          <a href={photo.license_url} target="_blank" rel="noreferrer">
            {photo.license}
          </a>{" "}
          · cropped
        </small>
      </div>
    </div>
  );
}
