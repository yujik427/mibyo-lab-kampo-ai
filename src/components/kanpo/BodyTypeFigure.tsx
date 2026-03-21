"use client";

import { ConstitutionAvatar } from "@/components/ConstitutionAvatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BodyFigureValues, BodyLabels } from "@/lib/kanpo/types";

interface BodyTypeFigureProps {
  values: BodyFigureValues;
  labels: BodyLabels;
}

export function BodyTypeFigure({ values, labels }: BodyTypeFigureProps) {
  return (
    <Card className="gap-4">
      <CardHeader className="pb-0">
        <CardTitle className="text-base">体質イメージ</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="flex justify-center">
          <ConstitutionAvatar
            kyojitsu={values.kyojitsu}
            upperTemp={values.upperTemp}
            lowerTemp={values.lowerTemp}
            soshitsu={values.soshitsu}
            upperTextureScore={values.upperTextureScore}
            lowerTextureScore={values.lowerTextureScore}
            size={220}
          />
        </div>

        <div className="grid flex-1 gap-3 text-sm leading-relaxed">
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">虚実</p>
            <p className="mt-1 font-medium">{labels.kyojitsu}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">寒熱</p>
            <p className="mt-1 font-medium">
              上半身: {labels.upperTemperature}
              <br />
              下半身: {labels.lowerTemperature}
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">燥湿</p>
            <p className="mt-1 font-medium">
              上半身: {labels.upperTexture}
              <br />
              下半身: {labels.lowerTexture}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
