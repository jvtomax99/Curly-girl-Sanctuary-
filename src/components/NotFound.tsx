// An app address that doesn't exist (#/something-else), and where GitHub Pages' 404 page sends
// a missing address (public/404.html).
export default function NotFound({ quizDone, go }: { quizDone: boolean; go: (hash: string) => void }) {
  return (
    <main className="screen not-found">
      <p className="label">404</p>
      <h1 className="screen-title">This page isn’t here</h1>
      <p className="note">The link may be old or mistyped.</p>
      <div className="card-actions">
        <button className="btn btn-primary" onClick={() => go(quizDone ? '#/card' : '#/quiz/0')}>
          {quizDone ? 'Back to my Curly ID' : 'Take the curl quiz'}
        </button>
      </div>
    </main>
  )
}
