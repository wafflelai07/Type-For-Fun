import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Type For Fun" },
      {
        name: "description",
        content: `It is a simple typing practice website built for fun.
Test your typing speed, accuracy, and time performance in a clean and minimal interface.`,
      },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "Type For Fun" },
      {
        property: "og:description",
        content: `It is a simple typing practice website built for fun.
Test your typing speed, accuracy, and time performance in a clean and minimal interface.`,
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "Type For Fun" },
      {
        name: "twitter:description",
        content: `It is a simple typing practice website built for fun.
Test your typing speed, accuracy, and time performance in a clean and minimal interface.`,
      },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/201b1b67-b43d-483e-9a22-6fbf8b61cf79/id-preview-02faf1c2--0a09e8dc-571f-4b34-9bc9-db1945289bd2.lovable.app-1777111548657.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/201b1b67-b43d-483e-9a22-6fbf8b61cf79/id-preview-02faf1c2--0a09e8dc-571f-4b34-9bc9-db1945289bd2.lovable.app-1777111548657.png",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

const themeInitScript = `
(function(){
  try {
    var t = localStorage.getItem('theme');
    if (
      t === 'dark' ||
      (!t && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
      document.documentElement.classList.add('dark');
    }
  } catch(e) {}
})();
`;

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return <Outlet />;
}
