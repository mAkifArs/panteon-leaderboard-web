import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const HERO_SLIDES = [
  '/panteon/hero/01.jpg',
  '/panteon/hero/02.jpg',
  '/panteon/hero/03.jpg',
  '/panteon/hero/04.jpg',
] as const

const GAMES = [
  {
    title: 'Arcane Arena: Tower Defense TD',
    tagline: 'Outlast rivals. Rule the arena.',
    img: '/panteon/games/arcane-arena.png',
  },
  {
    title: 'Raid Rush: Tower Defense TD',
    tagline: 'Pick a strategy. Take the win.',
    img: '/panteon/games/raid-rush.png',
  },
  {
    title: 'Airport Master!',
    tagline: 'Meet passengers, manage flights.',
    img: '/panteon/games/airport-master.png',
  },
  {
    title: 'Trading Master',
    tagline: 'Trade fidgets, become a master.',
    img: '/panteon/games/trading-master.png',
  },
  { title: 'Ball Brawl!', tagline: 'Build your team.', img: '/panteon/games/ball-brawl.png' },
] as const

const NEWS = [
  {
    title: 'Arcane Arena: Tower Defense TD is Now Live!',
    img: '/panteon/news/arcane-launch.jpg',
    date: 'Feb 2026',
  },
  {
    title: 'Panteon Pitstop 2025: Strategy, Fun, and Team Spirit',
    img: '/panteon/news/pitstop-2025.jpg',
    date: 'Oct 2025',
  },
  {
    title: 'Panteon celebrated its 13th anniversary at ODTÜ Teknokent',
    img: '/panteon/news/anniversary-13.jpg',
    date: 'Sep 2025',
  },
  {
    title: 'Raid Rush x Terminator 2: Judgment Day — Starts May 1!',
    img: '/panteon/news/rr-t2.jpg',
    date: 'Apr 2025',
  },
] as const

export function HomePage(): React.ReactElement {
  return (
    <>
      <Hero />
      <About />
      <News />
      <Games />
    </>
  )
}

function Hero(): React.ReactElement {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % HERO_SLIDES.length)
    }, 5000)
    return () => {
      clearInterval(id)
    }
  }, [])

  return (
    <section
      id="home"
      aria-label="Hero"
      className="relative h-[480px] w-full overflow-hidden bg-panteon-bg"
    >
      {HERO_SLIDES.map((src, i) => (
        <div
          key={src}
          aria-hidden={i !== index}
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
          style={{
            backgroundImage: `url(${src})`,
            opacity: i === index ? 0.6 : 0,
          }}
        />
      ))}

      <div className="relative z-10 flex h-full flex-col items-center justify-center gap-10 px-4">
        <img
          src="/panteon/brand/logo.png"
          alt=""
          aria-hidden="true"
          width={555}
          height={95}
          className="h-20 w-auto drop-shadow-2xl sm:h-24 md:h-28 lg:h-32"
        />
        <a
          href="#about"
          aria-label="Scroll to about section"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-panteon-orange text-panteon-fg shadow-lg transition-colors hover:bg-panteon-orange-deep"
        >
          <span aria-hidden="true" className="text-xl">
            ↓
          </span>
        </a>
      </div>
    </section>
  )
}

function About(): React.ReactElement {
  return (
    <section id="about" className="relative scroll-mt-24 bg-panteon-orange-soft">
      <img
        src="/panteon/badges/great-place-to-work.png"
        alt="Great Place to Work certified badge"
        width={150}
        height={212}
        className="absolute -top-36 right-8 hidden h-52 w-auto drop-shadow-xl md:block lg:right-16"
        loading="lazy"
      />
      <div className="mx-auto max-w-[1140px] px-[15px] py-16">
        <h2 className="text-center text-[18px] font-semibold uppercase leading-[1.2] tracking-[2px] text-panteon-eyebrow">
          About us
        </h2>
        <div className="mt-8 grid gap-10 md:grid-cols-2 md:items-start">
          <h3 className="text-[32px] font-extrabold leading-[1.4] tracking-[0.8px] text-panteon-fg">
            Through games,
            <br />
            adds colors to lives!
          </h3>
          <p className="text-[15px] leading-[1.6] text-panteon-fg md:pt-3">
            Panteon&rsquo;s story started in 2012 with a simple ambition: build mobile games
            millions love. Data, craft, and the team behind every release keep that ambition alive.
          </p>
        </div>
      </div>
    </section>
  )
}

function News(): React.ReactElement {
  return (
    <section id="news" className="scroll-mt-24 bg-panteon-bg">
      <div className="mx-auto max-w-[1140px] px-[15px] py-16">
        <header className="mb-8">
          <h2 className="text-center text-[18px] font-semibold uppercase leading-[1.2] tracking-[2px] text-panteon-eyebrow">
            What&rsquo;s going on?
          </h2>
        </header>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {NEWS.map((item) => (
            <li
              key={item.title}
              className="group overflow-hidden rounded-xl border border-panteon-border bg-panteon-surface transition-colors hover:border-panteon-orange"
            >
              <a href="#" className="block">
                <div className="aspect-[1200/491] w-full overflow-hidden bg-panteon-surface-2">
                  <img
                    src={item.img}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="flex flex-col gap-2 p-4">
                  <span className="text-[11px] uppercase tracking-[0.5px] text-panteon-muted">
                    {item.date}
                  </span>
                  <h3 className="text-[19px] font-bold leading-[1.3] tracking-[0.4px] text-panteon-fg">
                    {item.title}
                  </h3>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function Games(): React.ReactElement {
  return (
    <section id="games" className="scroll-mt-24 bg-panteon-surface-2">
      <div className="mx-auto max-w-[1140px] px-[15px] py-16">
        <header className="mb-10 text-center">
          <h2 className="text-[18px] font-semibold uppercase leading-[1.2] tracking-[2px] text-panteon-eyebrow">
            Games
          </h2>
        </header>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {GAMES.map((game) => (
            <li
              key={game.title}
              className="group overflow-hidden rounded-xl border border-panteon-border bg-panteon-surface transition-all hover:-translate-y-1 hover:border-panteon-orange"
            >
              <div className="aspect-[3/2] w-full overflow-hidden bg-panteon-bg">
                <img
                  src={game.img}
                  alt={game.title}
                  className="h-full w-full object-contain p-6 transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="flex flex-col gap-2 p-5">
                <h3 className="text-[24px] font-extrabold leading-[1.2] tracking-[1.5px] text-panteon-fg">
                  {game.title}
                </h3>
                <p className="text-[15px] text-panteon-muted">{game.tagline}</p>
              </div>
            </li>
          ))}
          <li className="flex flex-col items-start justify-center gap-3 rounded-xl border-2 border-dashed border-panteon-border bg-panteon-surface p-6">
            <span className="text-[12px] font-semibold uppercase tracking-[2px] text-panteon-orange">
              Case study
            </span>
            <h3 className="text-[24px] font-extrabold leading-[1.2] tracking-[1.5px] text-panteon-fg">
              Weekly Leaderboard
            </h3>
            <p className="text-[15px] text-panteon-muted">
              Top-100 + own-rank cluster, polling-based, prize pool distribution.
            </p>
            <Link
              to="/leaderboard"
              className="mt-2 inline-flex h-9 items-center gap-2 rounded-lg bg-panteon-orange px-4 text-[15px] font-medium uppercase text-panteon-fg transition-colors hover:bg-panteon-orange-deep"
            >
              View live demo
              <span aria-hidden="true">→</span>
            </Link>
          </li>
        </ul>
      </div>
    </section>
  )
}

