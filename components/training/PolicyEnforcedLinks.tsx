import { createClient as createServerClient } from '@/lib/supabase/server';
import { TrainingInternalLinks } from './TrainingInternalLinks';

type ContentEdge = {
  from_type: string;
  from_id: string;
  to_type: string;
  to_id: string;
  link_type: string;
  anchor_text: string;
  priority: number;
};

export async function PolicyEnforcedLinks({
  edges,
  currentType,
}: {
  edges: ContentEdge[];
  currentType: string;
}) {
  if (!edges || edges.length === 0) return null;

  const supabase = await createServerClient();
  
  // 1. Fetch the budgets for this page type
  const { data: policies } = await supabase
    .from('internal_link_policy')
    .select('to_page_type, max_link_count')
    .eq('from_page_type', currentType)
    .eq('enabled', true);

  const budgetMap: Record<string, number> = {};
  if (policies) {
    policies.forEach(p => {
      budgetMap[p.to_page_type] = p.max_link_count;
    });
  }

  // 2. Enforce limits based on policy (default max 4 if no policy)
  const countMap: Record<string, number> = {};
  const enforcedEdges: ContentEdge[] = [];

  for (const edge of edges) {
    const isOutbound = edge.from_type === currentType;
    const targetType = isOutbound ? edge.to_type : edge.from_type;
    
    // Reverse links count towards the 'to' type budget in this context
    const budget = budgetMap[targetType] || 4; 
    
    if (!countMap[targetType]) countMap[targetType] = 0;

    if (countMap[targetType] < budget) {
      enforcedEdges.push(edge);
      countMap[targetType]++;
    }
  }

  // 3. Render the standard component but with budget-enforced edges
  return <TrainingInternalLinks edges={enforcedEdges} />;
}
