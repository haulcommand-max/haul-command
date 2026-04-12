import { redirect } from 'next/navigation';

/**
 * Legacy /post-a-load route â€” redirects to the mobile-native wizard at /loads/post.
 * The old 413-line desktop form has been replaced by the 649-line mobile step flow.
 */
export default function LegacyPostALoadRedirect() {
    redirect('/loads/post');
}