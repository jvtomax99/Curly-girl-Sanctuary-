// Community, Learn and Curl Lab before their phases: honest coming-soon pages.
const WHAT: Record<string, { title: string; text: string }> = {
  community: { title: 'Community', text: 'Hair Posts (Best Day, Hot Mess), Tutorials and Ask the Sanctuary come with report, block and moderation, all together.' },
  learn: { title: 'Learn', text: 'Holy Grail, Around the World and more, every claim with its source.' },
  lab: { title: 'Curl Lab', text: 'Short, optional modules that go deeper than the quiz. Your deeper answers stay private.' },
}

export default function TabSoon({ tab }: { tab: string }) {
  const w = WHAT[tab] ?? WHAT.community
  return (
    <main className="screen soon-tab">
      <p className="label">Coming soon</p>
      <h1 className="screen-title">{w.title}</h1>
      <p>{w.text}</p>
    </main>
  )
}
