import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Plus, Trash2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface WorkingHoursManagerProps {
  staff: any[];
  tenantId: string;
}

const WEEKDAYS = [
  { id: 0, name: "Sonntag", short: "So" },
  { id: 1, name: "Montag", short: "Mo" },
  { id: 2, name: "Dienstag", short: "Di" },
  { id: 3, name: "Mittwoch", short: "Mi" },
  { id: 4, name: "Donnerstag", short: "Do" },
  { id: 5, name: "Freitag", short: "Fr" },
  { id: 6, name: "Samstag", short: "Sa" },
];

const TIME_BLOCK_TYPES = [
  { value: "work", label: "Arbeitszeit", color: "bg-green-500" },
  { value: "break", label: "Pause", color: "bg-yellow-500" },
  { value: "unavailable", label: "Nicht verfügbar", color: "bg-red-500" },
];

export default function WorkingHoursManager({ staff, tenantId }: WorkingHoursManagerProps) {
  const { toast } = useToast();
  const [selectedStaff, setSelectedStaff] = useState<string>("");
  const [timeBlocks, setTimeBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newBlock, setNewBlock] = useState({
    weekday: 1,
    type: "work",
    startTime: "09:00",
    endTime: "17:00",
    note: "",
  });

  useEffect(() => {
    if (selectedStaff) {
      loadTimeBlocks();
    }
  }, [selectedStaff]);

  const loadTimeBlocks = async () => {
    if (!selectedStaff) return;

    try {
      const { data, error } = await supabase
        .from('time_blocks')
        .select('*')
        .eq('staff_id', selectedStaff)
        .eq('tenant_id', tenantId)
        .order('weekday')
        .order('start_min');

      if (error) throw error;
      setTimeBlocks(data || []);
    } catch (error) {
      console.error('Error loading time blocks:', error);
    }
  };

  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const handleAddTimeBlock = async () => {
    if (!selectedStaff) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('time_blocks')
        .insert({
          tenant_id: tenantId,
          staff_id: selectedStaff,
          weekday: newBlock.weekday,
          type: newBlock.type,
          start_min: timeToMinutes(newBlock.startTime),
          end_min: timeToMinutes(newBlock.endTime),
          note: newBlock.note || null,
        });

      if (error) throw error;

      await loadTimeBlocks();
      setNewBlock({
        weekday: 1,
        type: "work",
        startTime: "09:00",
        endTime: "17:00",
        note: "",
      });

      toast({
        title: "Zeitblock hinzugefügt",
        description: "Der Zeitblock wurde erfolgreich erstellt.",
      });
    } catch (error) {
      console.error('Error adding time block:', error);
      toast({
        title: "Fehler",
        description: "Der Zeitblock konnte nicht erstellt werden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTimeBlock = async (blockId: string) => {
    try {
      const { error } = await supabase
        .from('time_blocks')
        .delete()
        .eq('id', blockId);

      if (error) throw error;

      await loadTimeBlocks();
      toast({
        title: "Zeitblock gelöscht",
        description: "Der Zeitblock wurde erfolgreich entfernt.",
      });
    } catch (error) {
      console.error('Error deleting time block:', error);
      toast({
        title: "Fehler",
        description: "Der Zeitblock konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    }
  };

  const getTypeConfig = (type: string) => {
    return TIME_BLOCK_TYPES.find(t => t.value === type) || TIME_BLOCK_TYPES[0];
  };

  const groupedBlocks = WEEKDAYS.map(day => ({
    ...day,
    blocks: timeBlocks.filter(block => block.weekday === day.id)
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Arbeitszeiten verwalten</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Mitarbeiter auswählen</Label>
              <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                <SelectTrigger>
                  <SelectValue placeholder="Mitarbeiter wählen..." />
                </SelectTrigger>
                <SelectContent>
                  {staff.filter(s => s.active).map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedStaff && (
              <div className="border rounded-lg p-4 space-y-4">
                <h4 className="font-medium">Neuen Zeitblock hinzufügen</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Wochentag</Label>
                    <Select
                      value={newBlock.weekday.toString()}
                      onValueChange={(value) => setNewBlock(prev => ({ ...prev, weekday: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {WEEKDAYS.map((day) => (
                          <SelectItem key={day.id} value={day.id.toString()}>
                            {day.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Typ</Label>
                    <Select
                      value={newBlock.type}
                      onValueChange={(value) => setNewBlock(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_BLOCK_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Von</Label>
                    <Input
                      type="time"
                      value={newBlock.startTime}
                      onChange={(e) => setNewBlock(prev => ({ ...prev, startTime: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Bis</Label>
                    <Input
                      type="time"
                      value={newBlock.endTime}
                      onChange={(e) => setNewBlock(prev => ({ ...prev, endTime: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notiz (optional)</Label>
                  <Input
                    value={newBlock.note}
                    onChange={(e) => setNewBlock(prev => ({ ...prev, note: e.target.value }))}
                    placeholder="z.B. Mittagspause, Außentermin..."
                  />
                </div>

                <Button onClick={handleAddTimeBlock} disabled={loading}>
                  <Plus className="h-4 w-4 mr-2" />
                  {loading ? "Hinzufügen..." : "Zeitblock hinzufügen"}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedStaff && (
        <Card>
          <CardHeader>
            <CardTitle>Wochenplan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {groupedBlocks.map((day) => (
                <div key={day.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">{day.name}</h4>
                    {day.blocks.length === 0 && (
                      <Badge variant="outline" className="text-muted-foreground">
                        Nicht verfügbar
                      </Badge>
                    )}
                  </div>

                  {day.blocks.length > 0 ? (
                    <div className="space-y-2">
                      {day.blocks.map((block) => {
                        const typeConfig = getTypeConfig(block.type);
                        return (
                          <div key={block.id} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full ${typeConfig.color}`} />
                              <span className="font-medium">
                                {minutesToTime(block.start_min)} - {minutesToTime(block.end_min)}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {typeConfig.label}
                              </Badge>
                              {block.note && (
                                <span className="text-sm text-muted-foreground">
                                  {block.note}
                                </span>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteTimeBlock(block.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Keine Arbeitszeiten definiert</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
