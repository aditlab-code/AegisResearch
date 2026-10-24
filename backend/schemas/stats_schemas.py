from pydantic import BaseModel


class StatsBaseRequest(BaseModel):
    file_path: str
    include_plot: bool = False
    plot_type: str | None = None


class DescriptiveAnalysisRequest(StatsBaseRequest):
    variables: list[str]
    include_normality: bool = True


class ReliabilityAnalysisRequest(StatsBaseRequest):
    items: list[str]


class RegressionAnalysisRequest(StatsBaseRequest):
    dependent: str
    independents: list[str]
    check_vif: bool = True
    check_durbin_watson: bool = True


class ManovaAnalysisRequest(StatsBaseRequest):
    dependents: list[str]
    factor: str


class PcaAnalysisRequest(StatsBaseRequest):
    variables: list[str]
    n_components: int | None = None


class TTestOneSampleRequest(StatsBaseRequest):
    variable: str
    test_value: float = 0.0
    alternative: str = "two-sided"
    missing_strategy: str = "pairwise"
    tests: list[str] | None = None


class TTestIndependentRequest(StatsBaseRequest):
    test_variable: str
    group_variable: str
    alternative: str = "two-sided"
    missing_strategy: str = "pairwise"
    tests: list[str] | None = None


class TTestPairedRequest(StatsBaseRequest):
    var1: str
    var2: str
    alternative: str = "two-sided"
    missing_strategy: str = "pairwise"
    tests: list[str] | None = None


class LogisticRegressionRequest(StatsBaseRequest):
    dependent: str
    independents: list[str]
    cutoff: float = 0.5
    missing_strategy: str = "listwise"


class AnovaOneWayRequest(StatsBaseRequest):
    dependent: str
    factor: str
    post_hoc: bool = True


class AnovaTwoWayRequest(StatsBaseRequest):
    dependent: str
    factor1: str
    factor2: str


class AncovaRequest(StatsBaseRequest):
    dependent: str
    factor: str
    covariates: list[str]


class CorrelationRequest(StatsBaseRequest):
    variables: list[str]


class MannWhitneyURequest(StatsBaseRequest):
    test_variable: str
    group_variable: str


class WilcoxonSignedRankRequest(StatsBaseRequest):
    var1: str
    var2: str


class KruskalWallisRequest(StatsBaseRequest):
    test_variable: str
    group_variable: str


class ChiSquareIndependenceRequest(StatsBaseRequest):
    row_variable: str
    col_variable: str


class DistributionPlotRequest(BaseModel):
    file_path: str
    variable: str


class GroupComparisonPlotRequest(BaseModel):
    file_path: str
    dependent: str
    factor: str


class RegressionPlotRequest(BaseModel):
    file_path: str
    dependent: str
    independents: list[str]


class RocPlotRequest(BaseModel):
    file_path: str
    dependent: str
    independents: list[str]
    cutoff: float = 0.5


class MeanDifferencePlotRequest(BaseModel):
    file_path: str
    test_variable: str
    group_variable: str
    alternative: str = "two-sided"


class CriticalRegionPlotRequest(BaseModel):
    file_path: str
    test_variable: str
    group_variable: str | None = None
    test_value: float = 0.0
    alternative: str = "two-sided"


class StandardizedPlotRequest(BaseModel):
    file_path: str
    plot_type: str
    dependent: str | None = None
    factor: str | None = None
    factor2: str | None = None
    independents: list[str] | None = None
    variables: list[str] | None = None
    covariates: list[str] | None = None
    var1: str | None = None
    var2: str | None = None
    test_value: float = 0.0
    alternative: str = "two-sided"
    cutoff: float = 0.5
