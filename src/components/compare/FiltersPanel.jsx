import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

export default function FiltersPanel({ filters, setFilters }) {
  const resetFilters = () => {
    setFilters({
      planType: "all",
      contractLength: "all",
      contractLengthMin: null,
      contractLengthMax: null,
      renewable: false,
      renewableMin: 0,
      noEarlyTerminationFee: false,
      sortBy: "rate"
    });
  };

  return (
    <Card className="sticky top-24">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Filter Plans</CardTitle>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={resetFilters}
          className="h-8 px-2"
        >
          <RotateCcw className="w-4 h-4 mr-1" />
          Reset
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Plan Type */}
        <div>
          <Label className="mb-2 block font-semibold">Plan Type</Label>
          <Select
            value={filters.planType}
            onValueChange={(value) => setFilters({ ...filters, planType: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="fixed">Fixed Rate</SelectItem>
              <SelectItem value="variable">Variable Rate</SelectItem>
              <SelectItem value="prepaid">Prepaid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Contract Length - Exact */}
        <div>
          <Label className="mb-2 block font-semibold">Exact Contract Length</Label>
          <Select
            value={filters.contractLength}
            onValueChange={(value) => setFilters({ ...filters, contractLength: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Lengths</SelectItem>
              <SelectItem value="1">1 Month</SelectItem>
              <SelectItem value="3">3 Months</SelectItem>
              <SelectItem value="6">6 Months</SelectItem>
              <SelectItem value="12">12 Months</SelectItem>
              <SelectItem value="24">24 Months</SelectItem>
              <SelectItem value="36">36 Months</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Contract Length Range */}
        <div>
          <Label className="mb-3 block font-semibold">
            Contract Length Range
          </Label>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-gray-600 mb-2 block">
                Min: {filters.contractLengthMin || 'Any'} months
              </Label>
              <Slider
                value={[filters.contractLengthMin || 0]}
                onValueChange={(value) => setFilters({ ...filters, contractLengthMin: value[0] || null })}
                min={0}
                max={36}
                step={1}
                className="cursor-pointer"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600 mb-2 block">
                Max: {filters.contractLengthMax || 'Any'} months
              </Label>
              <Slider
                value={[filters.contractLengthMax || 36]}
                onValueChange={(value) => setFilters({ ...filters, contractLengthMax: value[0] === 36 ? null : value[0] })}
                min={0}
                max={36}
                step={1}
                className="cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Renewable Energy Percentage */}
        <div>
          <Label className="mb-3 block font-semibold">
            Minimum Renewable Energy
          </Label>
          <div className="mb-2">
            <span className="text-sm font-medium text-gray-900">
              {filters.renewableMin}%+
            </span>
          </div>
          <Slider
            value={[filters.renewableMin]}
            onValueChange={(value) => setFilters({ ...filters, renewableMin: value[0] })}
            min={0}
            max={100}
            step={10}
            className="cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Checkboxes */}
        <div className="space-y-3 pt-2 border-t">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="renewable"
              checked={filters.renewable}
              onCheckedChange={(checked) => setFilters({ ...filters, renewable: checked })}
            />
            <Label htmlFor="renewable" className="cursor-pointer text-sm">
              50%+ Renewable Only
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="noEtf"
              checked={filters.noEarlyTerminationFee}
              onCheckedChange={(checked) => setFilters({ ...filters, noEarlyTerminationFee: checked })}
            />
            <Label htmlFor="noEtf" className="cursor-pointer text-sm">
              No Early Termination Fee
            </Label>
          </div>
        </div>

        {/* Sort By */}
        <div className="pt-2 border-t">
          <Label className="mb-2 block font-semibold">Sort By</Label>
          <Select
            value={filters.sortBy}
            onValueChange={(value) => setFilters({ ...filters, sortBy: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rate">Lowest Rate</SelectItem>
              <SelectItem value="contract">Contract Length</SelectItem>
              <SelectItem value="renewable">Renewable %</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}