"use client";

import { Button } from "@/components/ui/button";
import {
  DataTable,
  type ColumnDef,
  type FilterDef,
} from "@/components/ui/DataTable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Modal } from "@/components/ui/modal";
import { useAuth } from "@/contexts/auth-context";
import type { FoodCorrection } from "@/data/mock-data";
import { mockFoodCorrections } from "@/data/mock-data";
import { supabase } from "@/lib/supabase";
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  MoreHorizontal,
  RefreshCw,
  Sparkles,
  UtensilsCrossed,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

const statusStyles: Record<string, string> = {
  pending: "bg-amber/15 text-amber border-amber/30",
  approved: "bg-lime/15 text-lime border-lime/30",
  rejected: "bg-danger/15 text-danger border-danger/30",
};

const formatVal = (val: number | undefined | null) => {
  if (val === undefined || val === null || isNaN(Number(val))) return "-";
  const num = Number(val);
  const rounded = Math.round(num * 100) / 100;
  return Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toFixed(2).replace(/\.?0+$/, "");
};

export default function FoodCorrectionsPage() {
  const { user: currentAdmin } = useAuth();
  const [corrections, setCorrections] = useState<FoodCorrection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCorrection, setSelectedCorrection] =
    useState<FoodCorrection | null>(null);
  const [rejectingCorrection, setRejectingCorrection] =
    useState<FoodCorrection | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch corrections from Supabase
  const fetchCorrections = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("food_corrections")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching corrections:", error);
        setCorrections([]);
        return;
      }

      if (!data || data.length === 0) {
        setCorrections([]);
        return;
      }

      // Fetch user profiles for submitters
      const userIds = [...new Set(data.map((item: any) => item.user_id))];
      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", userIds);

      const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));

      const mapped: FoodCorrection[] = data.map((item: any) => {
        const profile = profileMap.get(item.user_id);
        const name =
          profile?.display_name || profile?.username || "Utilisateur";
        return {
          id: item.id,
          userId: item.user_id,
          userName: name,
          userAvatar: name.slice(0, 2).toUpperCase(),
          foodId: item.food_id,
          foodName: item.food_name,
          brand: item.brand,
          imageUrl: item.image_url,
          originalCalories: Number(item.original_calories) || 0,
          originalProtein: Number(item.original_protein) || 0,
          originalCarbs: Number(item.original_carbs) || 0,
          originalFat: Number(item.original_fat) || 0,
          originalSugars: item.original_sugars != null ? Number(item.original_sugars) : undefined,
          originalSaturatedFat: item.original_saturated_fat != null ? Number(item.original_saturated_fat) : undefined,
          originalFiber: item.original_fiber != null ? Number(item.original_fiber) : undefined,
          originalSalt: item.original_salt != null ? Number(item.original_salt) : undefined,
          originalServingSize: item.original_serving_size != null ? Number(item.original_serving_size) : undefined,
          calories: Number(item.calories) || 0,
          protein: Number(item.protein) || 0,
          carbs: Number(item.carbs) || 0,
          fat: Number(item.fat) || 0,
          sugars: item.sugars != null ? Number(item.sugars) : undefined,
          saturatedFat: item.saturated_fat != null ? Number(item.saturated_fat) : undefined,
          fiber: item.fiber != null ? Number(item.fiber) : undefined,
          salt: item.salt != null ? Number(item.salt) : undefined,
          servingSize: item.serving_size != null ? Number(item.serving_size) : undefined,
          status: item.status,
          rejectionReason: item.rejection_reason,
          createdAt: item.created_at,
        };
      });

      setCorrections(mapped);
    } catch (err) {
      console.error("Unexpected error in fetchCorrections:", err);
      setCorrections([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCorrections();
  }, [fetchCorrections]);

  // Actions
  const handleApprove = async (corr: FoodCorrection) => {
    setActionLoading(true);
    try {
      await supabase
        .from("food_corrections")
        .update({
          status: "approved",
          reviewed_by: currentAdmin?.id ?? null,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", corr.id);

      await supabase.from("verified_food_values").upsert(
        {
          food_id: corr.foodId,
          food_name: corr.foodName,
          brand: corr.brand ?? null,
          image_url: corr.imageUrl ?? null,
          calories: corr.calories,
          protein: corr.protein,
          carbs: corr.carbs,
          fat: corr.fat,
          sugars: corr.sugars ?? null,
          saturated_fat: corr.saturatedFat ?? null,
          fiber: corr.fiber ?? null,
          salt: corr.salt ?? null,
          serving_size: corr.servingSize ?? null,
          verified_by: currentAdmin?.id ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "food_id" }
      );
    } catch {
      // Ignore database errors if table not created yet in local dev
    }

    setCorrections((prev) =>
      prev.map((c) => (c.id === corr.id ? { ...c, status: "approved" } : c))
    );
    if (selectedCorrection?.id === corr.id) {
      setSelectedCorrection((prev) =>
        prev ? { ...prev, status: "approved" } : null
      );
    }
    setActionLoading(false);
  };

  const handleReject = async () => {
    if (!rejectingCorrection) return;
    setActionLoading(true);
    try {
      await supabase
        .from("food_corrections")
        .update({
          status: "rejected",
          rejection_reason: rejectionReason || null,
          reviewed_by: currentAdmin?.id ?? null,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", rejectingCorrection.id);
    } catch {
      // Ignore database errors
    }

    setCorrections((prev) =>
      prev.map((c) =>
        c.id === rejectingCorrection.id
          ? {
              ...c,
              status: "rejected",
              rejectionReason: rejectionReason || undefined,
            }
          : c
      )
    );

    if (selectedCorrection?.id === rejectingCorrection.id) {
      setSelectedCorrection((prev) =>
        prev
          ? {
              ...prev,
              status: "rejected",
              rejectionReason: rejectionReason || undefined,
            }
          : null
      );
    }

    setRejectingCorrection(null);
    setRejectionReason("");
    setActionLoading(false);
  };

  // KPIs
  const stats = useMemo(() => {
    return {
      total: corrections.length,
      pending: corrections.filter((c) => c.status === "pending").length,
      approved: corrections.filter((c) => c.status === "approved").length,
      rejected: corrections.filter((c) => c.status === "rejected").length,
    };
  }, [corrections]);

  // Column definitions
  const columns: ColumnDef<FoodCorrection>[] = [
    {
      key: "foodName",
      label: "Aliment & Marque",
      render: (corr) => (
        <div className="flex items-center gap-2.5 min-w-0 max-w-[220px]">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/50 bg-secondary/50">
            {corr.imageUrl ? (
              <Image
                src={corr.imageUrl}
                alt={corr.foodName}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1 truncate">
            <p className="font-semibold text-foreground text-sm truncate">
              {corr.foodName}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {corr.brand || "Marque non spécifiée"}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "userName",
      label: "Proposé par",
      render: (corr) => {
        const shortName =
          corr.userName.startsWith("user_") && corr.userName.length > 15
            ? `User ${corr.userName.slice(5, 9)}`
            : corr.userName;
        return (
          <div className="flex items-center gap-2 min-w-0 max-w-[140px]">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-lime/20 text-[10px] font-semibold text-lime">
              {corr.userAvatar || "U"}
            </div>
            <span
              className="text-xs text-foreground truncate"
              title={corr.userName}
            >
              {shortName}
            </span>
          </div>
        );
      },
    },
    {
      key: "calories",
      label: "Comparaison Macros (100g)",
      sortable: false,
      render: (corr) => (
        <div className="flex flex-col gap-0.5 text-xs whitespace-nowrap">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground/70 font-medium">Orig :</span>
            <span className="text-muted-foreground/80 line-through">
              {formatVal(corr.originalCalories)} kcal
            </span>
            <span className="text-muted-foreground/60 text-[11px]">
              ({formatVal(corr.originalProtein)}P · {formatVal(corr.originalCarbs)}G · {formatVal(corr.originalFat)}L)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-lime font-semibold">Prop :</span>
            <span className="font-bold text-foreground">
              {formatVal(corr.calories)} kcal
            </span>
            <span className="font-medium text-lime text-[11px]">
              ({formatVal(corr.protein)}P · {formatVal(corr.carbs)}G · {formatVal(corr.fat)}L)
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Statut",
      render: (corr) => (
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize whitespace-nowrap ${
            statusStyles[corr.status] ?? ""
          }`}
        >
          {corr.status === "pending" && <Clock className="h-3 w-3" />}
          {corr.status === "approved" && <CheckCircle2 className="h-3 w-3" />}
          {corr.status === "rejected" && <XCircle className="h-3 w-3" />}
          {corr.status === "pending"
            ? "En attente"
            : corr.status === "approved"
            ? "Validé"
            : "Rejeté"}
        </span>
      ),
    },
    {
      key: "id",
      label: "Actions",
      sortable: false,
      render: (corr) => (
        <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
          {corr.status === "pending" && (
            <>
              <Button
                size="sm"
                className="h-7 px-2.5 bg-lime text-primary-foreground hover:bg-lime-light text-xs font-medium"
                onClick={(e) => {
                  e.stopPropagation();
                  handleApprove(corr);
                }}
              >
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                Valider
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="h-7 px-2.5 text-xs font-medium"
                onClick={(e) => {
                  e.stopPropagation();
                  setRejectingCorrection(corr);
                }}
              >
                <XCircle className="mr-1 h-3.5 w-3.5" />
                Refuser
              </Button>
            </>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedCorrection(corr)}>
                Voir le détail complet
              </DropdownMenuItem>
              {corr.status !== "approved" && (
                <DropdownMenuItem onClick={() => handleApprove(corr)}>
                  Valider la modification
                </DropdownMenuItem>
              )}
              {corr.status !== "rejected" && (
                <DropdownMenuItem
                  className="text-danger"
                  onClick={() => setRejectingCorrection(corr)}
                >
                  Refuser la modification
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  const filters: FilterDef[] = [
    {
      key: "status",
      label: "Statut",
      options: [
        { label: "En attente", value: "pending" },
        { label: "Validé", value: "approved" },
        { label: "Rejeté", value: "rejected" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <UtensilsCrossed className="h-7 w-7 text-lime" />
            Modération des Aliments & Macros
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Validez ou refusez les modifications nutritionnelles soumises par les utilisateurs avant publication sur l&apos;application.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchCorrections}
          disabled={isLoading}
          className="self-start sm:self-auto gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Actualiser
        </Button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-amber/30 bg-amber/5 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-amber">En attente</span>
            <Clock className="h-5 w-5 text-amber" />
          </div>
          <p className="mt-3 text-3xl font-extrabold text-foreground">
            {stats.pending}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Nécessitent votre validation
          </p>
        </div>

        <div className="rounded-2xl border border-lime/30 bg-lime/5 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-lime">Validées</span>
            <CheckCircle2 className="h-5 w-5 text-lime" />
          </div>
          <p className="mt-3 text-3xl font-extrabold text-foreground">
            {stats.approved}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Visibles par tous les utilisateurs
          </p>
        </div>

        <div className="rounded-2xl border border-danger/30 bg-danger/5 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-danger">Rejetées</span>
            <XCircle className="h-5 w-5 text-danger" />
          </div>
          <p className="mt-3 text-3xl font-extrabold text-foreground">
            {stats.rejected}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Non conformes ou refusées
          </p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Total Propositions
            </span>
            <Sparkles className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="mt-3 text-3xl font-extrabold text-foreground">
            {stats.total}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Historique complet des soumissions
          </p>
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        data={corrections}
        columns={columns}
        filters={filters}
        searchKey="foodName"
        searchPlaceholder="Rechercher par nom d'aliment ou marque..."
        onRowClick={(corr) => setSelectedCorrection(corr)}
      />

      {/* Detail Modal */}
      {selectedCorrection && (
        <Modal
          open={!!selectedCorrection}
          onOpenChange={(open) => !open && setSelectedCorrection(null)}
          type="details"
          title="Détail de la proposition"
        >
          <div className="space-y-6">
            {/* Header info */}
            <div className="flex items-center gap-4 rounded-xl border border-border bg-secondary/30 p-4">
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-background">
                {selectedCorrection.imageUrl ? (
                  <Image
                    src={selectedCorrection.imageUrl}
                    alt={selectedCorrection.foodName}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <UtensilsCrossed className="h-7 w-7 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-foreground truncate">
                  {selectedCorrection.foodName}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedCorrection.brand || "Marque non spécifiée"}
                </p>
                <p className="text-xs text-muted-foreground/70 font-mono mt-0.5">
                  Code-barres / ID : {selectedCorrection.foodId}
                </p>
              </div>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
                  statusStyles[selectedCorrection.status] ?? ""
                }`}
              >
                {selectedCorrection.status}
              </span>
            </div>

            {/* Comparison Grid */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Flame className="h-4 w-4 text-lime" />
                Comparatif des valeurs pour 100 g
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {/* Original */}
                <div className="rounded-xl border border-border bg-card p-4 space-y-2.5">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Valeurs Originales (OFF)
                  </span>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Calories :</span>
                      <span className="font-semibold text-foreground">
                        {formatVal(selectedCorrection.originalCalories)} kcal
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Protéines :</span>
                      <span className="font-semibold text-foreground">
                        {formatVal(selectedCorrection.originalProtein)} g
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Glucides :</span>
                      <span className="font-semibold text-foreground">
                        {formatVal(selectedCorrection.originalCarbs)} g
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lipides :</span>
                      <span className="font-semibold text-foreground">
                        {formatVal(selectedCorrection.originalFat)} g
                      </span>
                    </div>
                    {selectedCorrection.originalSugars !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">· Dont sucres :</span>
                        <span className="font-semibold text-foreground">
                          {formatVal(selectedCorrection.originalSugars)} g
                        </span>
                      </div>
                    )}
                    {selectedCorrection.originalSaturatedFat !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">· Dont saturés :</span>
                        <span className="font-semibold text-foreground">
                          {formatVal(selectedCorrection.originalSaturatedFat)} g
                        </span>
                      </div>
                    )}
                    {selectedCorrection.originalFiber !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Fibres :</span>
                        <span className="font-semibold text-foreground">
                          {formatVal(selectedCorrection.originalFiber)} g
                        </span>
                      </div>
                    )}
                    {selectedCorrection.originalSalt !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sel :</span>
                        <span className="font-semibold text-foreground">
                          {formatVal(selectedCorrection.originalSalt)} g
                        </span>
                      </div>
                    )}
                    {selectedCorrection.originalServingSize !== undefined && (
                      <div className="flex justify-between border-t border-border/40 pt-1 mt-1">
                        <span className="text-muted-foreground">Portion :</span>
                        <span className="font-semibold text-foreground">
                          {formatVal(selectedCorrection.originalServingSize)} g
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Proposed */}
                <div className="rounded-xl border border-lime/40 bg-lime/5 p-4 space-y-2.5">
                  <span className="text-xs font-semibold text-lime uppercase tracking-wider">
                    Nouvelles Valeurs Proposées
                  </span>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Calories :</span>
                      <span className="font-bold text-lime">
                        {formatVal(selectedCorrection.calories)} kcal
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Protéines :</span>
                      <span className="font-bold text-lime">
                        {formatVal(selectedCorrection.protein)} g
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Glucides :</span>
                      <span className="font-bold text-lime">
                        {formatVal(selectedCorrection.carbs)} g
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lipides :</span>
                      <span className="font-bold text-lime">
                        {formatVal(selectedCorrection.fat)} g
                      </span>
                    </div>
                    {selectedCorrection.sugars !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">· Dont sucres :</span>
                        <span className="font-bold text-lime">
                          {formatVal(selectedCorrection.sugars)} g
                        </span>
                      </div>
                    )}
                    {selectedCorrection.saturatedFat !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">· Dont saturés :</span>
                        <span className="font-bold text-lime">
                          {formatVal(selectedCorrection.saturatedFat)} g
                        </span>
                      </div>
                    )}
                    {selectedCorrection.fiber !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Fibres :</span>
                        <span className="font-bold text-lime">
                          {formatVal(selectedCorrection.fiber)} g
                        </span>
                      </div>
                    )}
                    {selectedCorrection.salt !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sel :</span>
                        <span className="font-bold text-lime">
                          {formatVal(selectedCorrection.salt)} g
                        </span>
                      </div>
                    )}
                    {selectedCorrection.servingSize !== undefined && (
                      <div className="flex justify-between border-t border-lime/20 pt-1 mt-1">
                        <span className="text-muted-foreground">Portion :</span>
                        <span className="font-bold text-lime">
                          {formatVal(selectedCorrection.servingSize)} g
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Submitter details */}
            <div className="rounded-xl border border-border bg-secondary/20 p-3.5 text-xs text-muted-foreground flex items-center justify-between">
              <div>
                <span className="font-medium text-foreground">Soumis par : </span>
                {selectedCorrection.userName} ({selectedCorrection.userId.slice(0, 8)}...)
              </div>
              <div>
                {new Date(selectedCorrection.createdAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>

            {selectedCorrection.rejectionReason && (
              <div className="rounded-xl border border-danger/30 bg-danger/10 p-3.5 text-xs text-danger">
                <span className="font-bold">Motif du refus : </span>
                {selectedCorrection.rejectionReason}
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setSelectedCorrection(null)}
              >
                Fermer
              </Button>
              {selectedCorrection.status !== "rejected" && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    setRejectingCorrection(selectedCorrection);
                  }}
                  disabled={actionLoading}
                >
                  <XCircle className="mr-1.5 h-4 w-4" />
                  Refuser
                </Button>
              )}
              {selectedCorrection.status !== "approved" && (
                <Button
                  className="bg-lime text-primary-foreground hover:bg-lime-light font-semibold"
                  onClick={() => handleApprove(selectedCorrection)}
                  disabled={actionLoading}
                >
                  <CheckCircle2 className="mr-1.5 h-4 w-4" />
                  Valider et Publier
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Reject Reason Modal */}
      {rejectingCorrection && (
        <Modal
          open={!!rejectingCorrection}
          onOpenChange={(open) => {
            if (!open) {
              setRejectingCorrection(null);
              setRejectionReason("");
            }
          }}
          type="warning"
          title="Refuser la modification"
        >
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Êtes-vous sûr de vouloir refuser la proposition pour{" "}
              <strong className="text-foreground">
                {rejectingCorrection.foodName}
              </strong>
              ?
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">
                Motif du refus (optionnel) :
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ex: Valeurs non conformes aux données du fabricant..."
                rows={3}
                className="w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-lime"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setRejectingCorrection(null);
                  setRejectionReason("");
                }}
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={actionLoading}
              >
                Confirmer le refus
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
