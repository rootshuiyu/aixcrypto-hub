type PredictionPayload = {
  marketId: string;
  side: "yes" | "no";
  amount: number;
};

export function usePrediction() {
  const placePrediction = async (payload: PredictionPayload) => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return {
      txHash: "0x9b1f...d4a2",
      ...payload
    };
  };

  return {
    placePrediction
  };
}

