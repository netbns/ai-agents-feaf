import { useParams, useNavigate } from 'react-router-dom';
import { useBoard, useComponents, useRelationships } from '@/hooks/useApi';
import { useCanvasStore } from '@/store/canvas';

export default function BoardDetailPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const { data: board, isLoading: isBoardLoading } = useBoard(boardId || null);
  const { data: componentsData } = useComponents(boardId || null);
  const { data: relationshipsData } = useRelationships(boardId || null);
  const selectedComponentId = useCanvasStore((state) => state.selectedComponentId);

  if (!boardId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Invalid board ID</p>
      </div>
    );
  }

  if (isBoardLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading board...</p>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="flex items-center justify-center min-h-screen flex-col gap-4">
        <p className="text-gray-500">Board not found</p>
        <button
          onClick={() => navigate('/boards')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Back to Boards
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow px-6 py-4 border-b">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{board.name}</h1>
            <p className="text-sm text-gray-600 mt-1">
              {board.description}
            </p>
          </div>
          <button
            onClick={() => navigate('/boards')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Back
          </button>
        </div>
      </div>

      {/* Canvas area */}
      <div className="flex-1 relative overflow-auto bg-gray-100">
        <div className="p-8">
          <div className="bg-white rounded-lg shadow p-6 min-h-[600px]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Components
                </h3>
                {componentsData?.data && componentsData.data.length > 0 ? (
                  <ul className="space-y-2">
                    {componentsData.data.map((component) => (
                      <li
                        key={component.id}
                        className={`p-3 rounded border cursor-pointer transition ${
                          selectedComponentId === component.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-medium text-gray-900">
                          {component.name}
                        </div>
                        <div className="text-xs text-gray-600">
                          {component.type}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No components yet</p>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Relationships
                </h3>
                {relationshipsData?.data && relationshipsData.data.length > 0 ? (
                  <ul className="space-y-2">
                    {relationshipsData.data.map((relationship) => (
                      <li key={relationship.id} className="p-3 rounded border border-gray-200">
                        <div className="font-medium text-gray-900 text-sm">
                          {relationship.type}
                        </div>
                        <div className="text-xs text-gray-600">
                          {relationship.description}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No relationships yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
