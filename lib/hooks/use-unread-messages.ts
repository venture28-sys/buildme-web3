"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface UnreadState {
  total: number;
  byJob: Record<string, number>;
  byProduct: Record<string, number>;
}

/**
 * Live unread-message counts for the current user, broken down by job AND
 * by product (messages now belong to exactly one of the two — see the
 * generalize_messages_to_products migration) so a dashboard can badge the
 * specific conversation that has new messages, not just show one vague total.
 */
export function useUnreadMessages(userId: string | null): UnreadState {
  const supabase = createClient();
  const [state, setState] = useState<UnreadState>({ total: 0, byJob: {}, byProduct: {} });

  useEffect(() => {
    if (!userId) return;

    async function refetch() {
      const { data } = await supabase
        .from("messages")
        .select("job_id, product_id")
        .eq("recipient_id", userId)
        .is("read_at", null);

      const byJob: Record<string, number> = {};
      const byProduct: Record<string, number> = {};
      (data || []).forEach((m) => {
        if (m.job_id) byJob[m.job_id] = (byJob[m.job_id] || 0) + 1;
        if (m.product_id) byProduct[m.product_id] = (byProduct[m.product_id] || 0) + 1;
      });
      setState({ total: data?.length ?? 0, byJob, byProduct });
    }

    refetch();

    // Both INSERT (a new unread message arrives) and UPDATE (one gets marked
    // read, possibly from another open tab) change the unread count, so both
    // need to trigger a refetch — not just new messages.
    const channel = supabase
      .channel(`unread-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `recipient_id=eq.${userId}` },
        refetch
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return state;
}
