import { useEffect, useState } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface LimitIndicatorProps {
  type: 'staff' | 'appointments';
  className?: string;
}

const LimitIndicator = ({ type, className = "" }: LimitIndicatorProps) => {
  const { checkLimit, planLimits } = useSubscription();
  const [limitData, setLimitData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLimitData = async () => {
      setLoading(true);
      const data = await checkLimit(type);
      setLimitData(data);
      setLoading(false);
    };

    loadLimitData();
  }, [type, checkLimit]);

  if (loading || !limitData) {
    return null;
  }

  const { current, limit, withinLimit } = limitData;
  const isUnlimited = limit === 'unlimited';
  const percentage = isUnlimited ? 0 : (current / limit) * 100;

  const getVariant = () => {
    if (isUnlimited) return "secondary";
    if (percentage >= 90) return "destructive";
    if (percentage >= 70) return "outline";
    return "secondary";
  };

  const getLimitText = () => {
    if (type === 'staff') {
      return isUnlimited ? `${current} Mitarbeiter` : `${current} / ${limit} Mitarbeiter`;
    } else {
      return isUnlimited ? `${current} Termine (diesen Monat)` : `${current} / ${limit} Termine (diesen Monat)`;
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <Badge variant={getVariant()} className="text-xs">
          {getLimitText()}
        </Badge>
        {!withinLimit && (
          <Badge variant="destructive" className="text-xs">
            Limit erreicht
          </Badge>
        )}
      </div>
      {!isUnlimited && (
        <Progress
          value={percentage}
          className="h-2"
        />
      )}
    </div>
  );
};

export default LimitIndicator;
