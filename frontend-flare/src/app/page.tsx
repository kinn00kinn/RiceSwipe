import { createServerComponentClient } from '@/lib/supabase/utils';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import VideoFeed from './components/VideoFeed';

export default async function Page() {
  const supabase = createServerComponentClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  const signOut = async () => {
    'use server';

    const supabase = createServerComponentClient();
    await supabase.auth.signOut();
    return redirect('/login');
  };

  return (
    <div className="flex-1 w-full flex flex-col items-center bg-gray-100">
      <header className="w-full flex justify-center border-b border-b-foreground/10 h-16 bg-white">
        <div className="w-full max-w-4xl flex justify-between items-center p-3 text-sm">
          <div className="font-semibold text-lg">RiceSwipe</div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline">Hey, {user.email}</span>
            <form action={signOut}>
              <button className="py-2 px-4 rounded-md no-underline bg-gray-200 hover:bg-gray-300">
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full py-8 flex justify-center">
        <VideoFeed />
      </main>
    </div>
  );
}
