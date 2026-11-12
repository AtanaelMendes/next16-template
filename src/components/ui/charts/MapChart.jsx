'use client';

import { useEffect, useState, useMemo } from 'react';

const INITIAL_UNIDADES = [
  {
    CD_PESSOA: 80197,
    NM_UNIDADE: 'RHBRASIL - JOINVILLE',
    CD_UF: 'SC',
    NM_CIDADE: 'JOINVILLE',
    DS_EMAIL: 'joinville@rhbrasil.com.br',
    CD_CEP: 89204250,
    GR_LATITUDE: '-26.29783',
    GR_LONGITUDE: '-48.85054',
    GR_LOCALIZACAO: null,
  },
  {
    CD_PESSOA: 80229,
    NM_UNIDADE: 'RH GLOBAL',
    CD_UF: 'PR',
    NM_CIDADE: 'CURITIBA',
    DS_EMAIL: 'jonas@gruporhbrasil.com.br',
    CD_CEP: 80030100,
    GR_LATITUDE: '-25.42284',
    GR_LONGITUDE: '-49.26548',
    GR_LOCALIZACAO: 498035,
  },
  {
    CD_PESSOA: 611760,
    NM_UNIDADE: 'RHBRASIL - SAO PAULO',
    CD_UF: 'SP',
    NM_CIDADE: 'SAO PAULO',
    DS_EMAIL: 'saopaulo@rhbrasil.com.br',
    CD_CEP: 2034006,
    GR_LATITUDE: '-23.50537',
    GR_LONGITUDE: '-46.62535',
    GR_LOCALIZACAO: null,
  },
  {
    CD_PESSOA: 701066,
    NM_UNIDADE: 'RHBRASIL - MATRIZ',
    CD_UF: 'SC',
    NM_CIDADE: 'JOINVILLE',
    DS_EMAIL: 'comercial@rhbrasil.com.br;nadiese.voigt@rhbrasil.com.br',
    CD_CEP: 89204250,
    GR_LATITUDE: '-26.29783',
    GR_LONGITUDE: '-48.85054',
    GR_LOCALIZACAO: null,
  },
  {
    CD_PESSOA: 2626352,
    NM_UNIDADE: 'RHBRASIL - TRADE',
    CD_UF: 'SC',
    NM_CIDADE: 'JOINVILLE',
    DS_EMAIL: 'trade@rhbprommo.com.br',
    CD_CEP: 89204250,
    GR_LATITUDE: '-26.29783',
    GR_LONGITUDE: '-48.85054',
    GR_LOCALIZACAO: null,
  },
  {
    CD_PESSOA: 3556513,
    NM_UNIDADE: 'DREAM JOB',
    CD_UF: 'SC',
    NM_CIDADE: 'JOINVILLE',
    DS_EMAIL: 'sandra@dreamjob.com.br',
    CD_CEP: 89201405,
    GR_LATITUDE: '-26.30307',
    GR_LONGITUDE: '-48.85092',
    GR_LOCALIZACAO: null,
  },
  {
    CD_PESSOA: 5697939,
    NM_UNIDADE: 'DAYONE',
    CD_UF: 'SC',
    NM_CIDADE: 'JOINVILLE',
    DS_EMAIL: 'suporte@rhbrasil.com.br',
    CD_CEP: 89201710,
    GR_LATITUDE: '-26.30307',
    GR_LONGITUDE: '-48.85092',
    GR_LOCALIZACAO: null,
  },
];

// Projeção geográfica calibrada para viewBox 0 0 750 720
function projectCoordinates(lat, lng) {
  const minLng = -73.99;
  const maxLng = -34.79;
  const minLat = -33.75;
  const maxLat = 5.27;

  const width = 640;
  const height = 620;
  const offsetX = 55;
  const offsetY = 50;

  const x = ((lng - minLng) / (maxLng - minLng)) * width + offsetX;
  const y = ((maxLat - lat) / (maxLat - minLat)) * height + offsetY;

  return { x, y };
}

// Caminhos vetoriais simplificados para os estados do Brasil
const BRAZIL_STATES = [
  // Região Sul
  {
    id: 'BR-RS',
    uf: 'RS',
    name: 'Rio Grande do Sul',
    d: 'M370,590 L445,595 L460,630 L455,670 L415,705 L375,690 L345,640 Z',
  },
  {
    id: 'BR-SC',
    uf: 'SC',
    name: 'Santa Catarina',
    d: 'M385,550 L470,555 L485,585 L445,595 L370,590 L380,560 Z',
    hasBranches: true,
  },
  {
    id: 'BR-PR',
    uf: 'PR',
    name: 'Paraná',
    d: 'M375,505 L465,510 L495,545 L470,555 L385,550 L370,520 Z',
    hasBranches: true,
  },
  // Região Sudeste
  {
    id: 'BR-SP',
    uf: 'SP',
    name: 'São Paulo',
    d: 'M440,470 L515,475 L545,505 L515,535 L465,510 L440,485 Z',
    hasBranches: true,
  },
  {
    id: 'BR-RJ',
    uf: 'RJ',
    name: 'Rio de Janeiro',
    d: 'M545,505 L590,495 L600,515 L565,525 L545,505 Z',
  },
  {
    id: 'BR-ES',
    uf: 'ES',
    name: 'Espírito Santo',
    d: 'M585,445 L615,445 L600,505 L585,495 Z',
  },
  {
    id: 'BR-MG',
    uf: 'MG',
    name: 'Minas Gerais',
    d: 'M465,410 L565,405 L600,455 L585,495 L545,505 L515,475 L465,445 Z',
  },
  // Região Centro-Oeste
  {
    id: 'BR-MS',
    uf: 'MS',
    name: 'Mato Grosso do Sul',
    d: 'M330,460 L440,470 L435,525 L375,505 L340,480 Z',
  },
  {
    id: 'BR-MT',
    uf: 'MT',
    name: 'Mato Grosso',
    d: 'M255,340 L385,335 L425,415 L365,465 L275,445 L255,390 Z',
  },
  {
    id: 'BR-GO',
    uf: 'GO',
    name: 'Goiás',
    d: 'M425,380 L495,385 L490,455 L440,470 L425,415 Z',
  },
  {
    id: 'BR-DF',
    uf: 'DF',
    name: 'Distrito Federal',
    d: 'M472,412 L482,412 L482,422 L472,422 Z',
  },
  // Região Norte
  {
    id: 'BR-RO',
    uf: 'RO',
    name: 'Rondônia',
    d: 'M185,340 L255,340 L260,390 L210,410 L185,370 Z',
  },
  {
    id: 'BR-AC',
    uf: 'AC',
    name: 'Acre',
    d: 'M70,335 L165,335 L175,370 L115,375 L70,335 Z',
  },
  {
    id: 'BR-AM',
    uf: 'AM',
    name: 'Amazonas',
    d: 'M115,190 L305,185 L320,295 L225,335 L135,320 L95,245 Z',
  },
  {
    id: 'BR-RR',
    uf: 'RR',
    name: 'Roraima',
    d: 'M235,100 L305,100 L295,185 L225,180 Z',
  },
  {
    id: 'BR-PA',
    uf: 'PA',
    name: 'Pará',
    d: 'M305,185 L465,185 L485,310 L385,335 L320,295 Z',
  },
  {
    id: 'BR-AP',
    uf: 'AP',
    name: 'Amapá',
    d: 'M405,105 L460,110 L445,185 L395,180 Z',
  },
  {
    id: 'BR-TO',
    uf: 'TO',
    name: 'Tocantins',
    d: 'M445,290 L495,290 L485,385 L435,385 L425,335 Z',
  },
  // Região Nordeste
  {
    id: 'BR-MA',
    uf: 'MA',
    name: 'Maranhão',
    d: 'M465,195 L545,200 L535,285 L475,285 L465,225 Z',
  },
  {
    id: 'BR-PI',
    uf: 'PI',
    name: 'Piauí',
    d: 'M535,220 L585,225 L575,310 L525,310 L525,260 Z',
  },
  {
    id: 'BR-CE',
    uf: 'CE',
    name: 'Ceará',
    d: 'M585,205 L640,210 L630,260 L580,250 Z',
  },
  {
    id: 'BR-RN',
    uf: 'RN',
    name: 'Rio Grande do Norte',
    d: 'M640,210 L685,215 L675,245 L630,240 Z',
  },
  {
    id: 'BR-PB',
    uf: 'PB',
    name: 'Paraíba',
    d: 'M635,240 L690,245 L685,265 L630,260 Z',
  },
  {
    id: 'BR-PE',
    uf: 'PE',
    name: 'Pernambuco',
    d: 'M575,260 L690,265 L680,285 L575,280 Z',
  },
  {
    id: 'BR-AL',
    uf: 'AL',
    name: 'Alagoas',
    d: 'M650,285 L680,285 L670,305 L645,300 Z',
  },
  {
    id: 'BR-SE',
    uf: 'SE',
    name: 'Sergipe',
    d: 'M635,305 L665,305 L655,325 L630,320 Z',
  },
  {
    id: 'BR-BA',
    uf: 'BA',
    name: 'Bahia',
    d: 'M495,305 L615,310 L635,395 L585,435 L515,415 L490,365 Z',
  },
];

const MapChart = () => {
  const [selectedUnidade, setSelectedUnidade] = useState(null);
  const [selectedEstado, setSelectedEstado] = useState(null);
  const [hoveredState, setHoveredState] = useState(null);
  const [hoveredUnit, setHoveredUnit] = useState(null);
  const rhbUnidades = INITIAL_UNIDADES;

  // Fechamento de modal via tecla ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedEstado(null);
        setSelectedUnidade(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Cores por estado ativo
  const stateColorConfig = {
    SC: { fill: '#fee2e2', stroke: '#ff6b6b', hover: '#fca5a5', pin: '#ff6b6b' },
    SP: { fill: '#ccfbf1', stroke: '#4ecdc4', hover: '#99f6e4', pin: '#4ecdc4' },
    PR: { fill: '#e0f2fe', stroke: '#45b7d1', hover: '#bae6fd', pin: '#45b7d1' },
  };

  // Cálculo dos pontos das unidades com dispersão circular para Joinville
  const projectedUnits = useMemo(() => {
    const joinvilleUnits = rhbUnidades.filter(u => u.NM_CIDADE === 'JOINVILLE');
    const joinvilleBase = projectCoordinates(-26.29783, -48.85054);

    return rhbUnidades.map((unidade) => {
      let x, y;

      if (unidade.NM_CIDADE === 'JOINVILLE') {
        const offsetIndex = joinvilleUnits.findIndex(u => u.CD_PESSOA === unidade.CD_PESSOA);
        const count = joinvilleUnits.length;
        const angle = (offsetIndex * 2 * Math.PI) / count - Math.PI / 2;
        const radius = 16;
        x = joinvilleBase.x + radius * Math.cos(angle);
        y = joinvilleBase.y + radius * Math.sin(angle);
      } else {
        const proj = projectCoordinates(parseFloat(unidade.GR_LATITUDE), parseFloat(unidade.GR_LONGITUDE));
        x = proj.x;
        y = proj.y;
      }

      return {
        ...unidade,
        x,
        y,
        color: stateColorConfig[unidade.CD_UF]?.pin || '#94a3b8',
      };
    });
  }, [rhbUnidades]);

  const handleStateClick = (state) => {
    const filiais = rhbUnidades.filter(u => u.CD_UF === state.uf);
    if (filiais.length > 0) {
      setSelectedEstado({
        uf: state.uf,
        nome: state.name,
        filiais,
      });
    }
  };

  // Modal para listar filiais por estado
  const EstadoFiliais = ({ estado }) => {
    const coresEstado = {
      SC: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', button: 'bg-red-500 hover:bg-red-600' },
      SP: { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-800', button: 'bg-teal-500 hover:bg-teal-600' },
      PR: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', button: 'bg-blue-500 hover:bg-blue-600' },
    };
    const cores = coresEstado[estado.uf] || coresEstado.SC;

    return (
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={() => setSelectedEstado(null)}
        role="dialog"
        aria-modal="true"
      >
        <div
          className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          <div className="p-6">
            <div className={`${cores.bg} ${cores.border} border rounded-lg p-4 mb-6`}>
              <div className="flex justify-between items-center">
                <h2 className={`text-2xl font-bold ${cores.text}`}>
                  🏢 Filiais em {estado.nome} ({estado.filiais.length} unidades)
                </h2>
                <button
                  onClick={() => setSelectedEstado(null)}
                  className="text-gray-400 hover:text-gray-700 text-2xl font-bold transition-colors"
                  aria-label="Fechar modal"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Clique em qualquer filial para visualizar todos os detalhes.
              </p>
            </div>

            <div className="grid gap-3">
              {estado.filiais.map(filial => (
                <div
                  key={filial.CD_PESSOA}
                  className={`${cores.border} border rounded-lg p-4 hover:${cores.bg} cursor-pointer transition-all duration-200 hover:shadow-md flex justify-between items-center`}
                  onClick={() => {
                    setSelectedEstado(null);
                    setSelectedUnidade(filial);
                  }}
                >
                  <div>
                    <h3 className="text-base font-semibold text-gray-800">
                      🏢 {filial.NM_UNIDADE}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      📍 {filial.NM_CIDADE} - {filial.CD_UF} | 📮 CEP: {String(filial.CD_CEP).replace(/(\d{5})(\d{3})/, '$1-$2')} | ✉️ {filial.DS_EMAIL.split(';')[0]}
                    </p>
                  </div>
                  <button className={`${cores.button} text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors`}>
                    Ver Detalhes
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => setSelectedEstado(null)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Modal para exibir detalhes da unidade
  const UnidadeDetails = ({ unidade }) => (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={() => setSelectedUnidade(null)}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{unidade.NM_UNIDADE}</h2>
            <button
              onClick={() => setSelectedUnidade(null)}
              className="text-gray-400 hover:text-gray-700 text-2xl font-bold transition-colors"
              aria-label="Fechar detalhes"
            >
              ✕
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg space-y-2 text-sm">
              <h3 className="font-semibold text-blue-900">Informações da Unidade</h3>
              <p><span className="font-medium text-gray-600">Cidade:</span> {unidade.NM_CIDADE} - {unidade.CD_UF}</p>
              <p><span className="font-medium text-gray-600">CEP:</span> {String(unidade.CD_CEP).replace(/(\d{5})(\d{3})/, '$1-$2')}</p>
              <p><span className="font-medium text-gray-600">Código Pessoa:</span> {unidade.CD_PESSOA}</p>
              <p><span className="font-medium text-gray-600">Email:</span> {unidade.DS_EMAIL}</p>
            </div>

            <div className="bg-emerald-50 p-4 rounded-lg space-y-3">
              <h3 className="font-semibold text-emerald-900 text-sm">Ações Rápidas</h3>
              <button
                onClick={() => window.open(`https://maps.google.com/?q=${unidade.GR_LATITUDE},${unidade.GR_LONGITUDE}`, '_blank')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                📍 Ver no Google Maps
              </button>
              <button
                onClick={() => window.open(`mailto:${unidade.DS_EMAIL.split(';')[0].trim()}`, '_blank')}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                ✉️ Enviar Email
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => setSelectedUnidade(null)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="w-full bg-gray-50 p-4 rounded-xl border border-gray-200">
        <div className="w-full flex items-center justify-center relative min-h-[420px]">
          <svg
            viewBox="0 0 750 720"
            className="w-full max-w-[650px] h-auto drop-shadow-sm select-none"
            role="img"
            aria-label="Mapa do Brasil com Filiais RHBrasil"
          >
            <title>Mapa de Unidades e Filiais RHBrasil</title>

            {/* Polígonos dos estados */}
            {BRAZIL_STATES.map((state) => {
              const isTargetState = Boolean(stateColorConfig[state.uf]);
              const config = stateColorConfig[state.uf];
              const isHovered = hoveredState === state.uf;

              let fill = '#f1f5f9';
              let stroke = '#cbd5e1';
              let strokeWidth = '1';

              if (isTargetState) {
                fill = isHovered ? config.hover : config.fill;
                stroke = config.stroke;
                strokeWidth = isHovered ? '2.5' : '1.8';
              } else if (isHovered) {
                fill = '#e2e8f0';
              }

              return (
                <path
                  key={state.id}
                  id={state.id}
                  d={state.d}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  className={isTargetState ? 'cursor-pointer transition-all duration-200' : 'transition-colors duration-200'}
                  onMouseEnter={() => setHoveredState(state.uf)}
                  onMouseLeave={() => setHoveredState(null)}
                  onClick={() => handleStateClick(state)}
                >
                  <title>{`${state.name} (${state.uf})`}</title>
                </path>
              );
            })}

            {/* Rótulos dos estados com filiais */}
            <text x="495" y="525" className="text-[12px] font-bold fill-teal-800 pointer-events-none select-none">SP</text>
            <text x="420" y="535" className="text-[12px] font-bold fill-sky-800 pointer-events-none select-none">PR</text>
            <text x="425" y="575" className="text-[12px] font-bold fill-red-800 pointer-events-none select-none">SC</text>

            {/* Pins das unidades com efeito de pulso e clique */}
            {projectedUnits.map((unidade) => {
              const isHovered = hoveredUnit === unidade.CD_PESSOA;

              return (
                <g
                  key={unidade.CD_PESSOA}
                  transform={`translate(${unidade.x}, ${unidade.y})`}
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedUnidade(unidade);
                  }}
                  onMouseEnter={() => setHoveredUnit(unidade.CD_PESSOA)}
                  onMouseLeave={() => setHoveredUnit(null)}
                >
                  {/* Anel de destaque no hover */}
                  {isHovered && (
                    <circle
                      r="13"
                      fill={unidade.color}
                      opacity="0.3"
                      className="animate-ping"
                    />
                  )}

                  {/* Pin Circle */}
                  <circle
                    r={isHovered ? '9' : '6.5'}
                    fill={unidade.color}
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="transition-all duration-150 drop-shadow"
                  />

                  {/* Tooltip rápida no hover do pin */}
                  {isHovered && (
                    <g transform="translate(0, -18)" className="pointer-events-none">
                      <rect
                        x="-70"
                        y="-22"
                        width="140"
                        height="22"
                        rx="5"
                        fill="#1e293b"
                        className="shadow-md"
                      />
                      <text
                        textAnchor="middle"
                        dominantBaseline="middle"
                        y="-10"
                        className="text-[10px] font-semibold fill-white"
                      >
                        {unidade.NM_UNIDADE}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legenda e contadores por estado */}
        <div className="mt-4 pt-3 border-t border-gray-200 text-center">
          <div className="flex flex-wrap justify-center items-center gap-4 text-xs font-medium text-gray-700">
            <button
              onClick={() => handleStateClick({ uf: 'SC', name: 'Santa Catarina' })}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-red-50 hover:bg-red-100 transition-colors border border-red-200"
            >
              <span className="w-3 h-3 rounded-full bg-[#ff6b6b] border border-white"></span>
              <span>Santa Catarina ({rhbUnidades.filter(u => u.CD_UF === 'SC').length})</span>
            </button>
            <button
              onClick={() => handleStateClick({ uf: 'SP', name: 'São Paulo' })}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-teal-50 hover:bg-teal-100 transition-colors border border-teal-200"
            >
              <span className="w-3 h-3 rounded-full bg-[#4ecdc4] border border-white"></span>
              <span>São Paulo ({rhbUnidades.filter(u => u.CD_UF === 'SP').length})</span>
            </button>
            <button
              onClick={() => handleStateClick({ uf: 'PR', name: 'Paraná' })}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-200"
            >
              <span className="w-3 h-3 rounded-full bg-[#45b7d1] border border-white"></span>
              <span>Paraná ({rhbUnidades.filter(u => u.CD_UF === 'PR').length})</span>
            </button>
          </div>
          <p className="text-[11px] text-gray-500 mt-2">
            Clique nos pins para detalhes da unidade ou nos estados para ver todas as filiais
          </p>
        </div>
      </div>

      {selectedEstado && <EstadoFiliais estado={selectedEstado} />}
      {selectedUnidade && <UnidadeDetails unidade={selectedUnidade} />}
    </>
  );
};

export default MapChart;
