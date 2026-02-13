import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
from tqdm import tqdm
import umap

class PolyhedronGenerator:
    def __init__(self, n_dimensions, n_vertices, radius=1.0, center=None):
        self.n_dimensions = n_dimensions
        self.n_vertices = n_vertices
        self.radius = np.float64(radius)
        self.center = np.zeros(n_dimensions, dtype=np.float64) if center is None else np.array(center, dtype=np.float64)
        self.n_edges, self.n_faces, self.target_neighbors = self._calculate_target_edges()
        self.tammes_vertices = self._initialize_vertices()
        self.thomson_vertices = self._initialize_vertices()
    
    def _initialize_vertices(self):
        """
        Initialize vertices quasi-uniformly on n-sphere using Cartesian coordinates
        """
        # Generate random points on an n-sphere
        vertices = np.random.normal(0.0, 1.0, (self.n_vertices, self.n_dimensions))
        norms = np.linalg.norm(vertices, axis=1)
        return vertices / norms[:, np.newaxis] * self.radius
    
    def _calculate_target_edges(self):
        """Calculate target number of edges using Euler's formula
        V - E + F = 2
        For triangular faces: 2E = 3F (each edge belongs to 2 faces, each face has 3 edges)
        Solving these equations:
        F = 2(E/3)
        V - E + 2(E/3) = 2
        3V - 3E + 2E = 6
        3V - E = 6
        E = 3V - 6
        """
        V = self.n_vertices
        E = 3 * V - 6  # Maximum number of edges for triangular faces
        F = 2 * (E // 3)  # Number of triangular faces
        # Each vertex should connect to approximately 2E/V other vertices
        target_neighbors = (2 * E) // V
        return E, F, target_neighbors
    
    def _project_to_sphere(self, vertices, radius = 1):
        """
        Returns the Euclidean projection of vertices onto the n-sphere given the radius.
        """
        norms = np.linalg.norm(vertices, axis=1)
        return vertices / norms[:, np.newaxis] * radius
    
    def _get_all_distances(self, vertices):
        """
        Get all pairwise distances between vertices
        """
        distances = np.zeros((self.n_vertices, self.n_vertices))
        for i in range(self.n_vertices):
            for j in range(i + 1, self.n_vertices):
                distances[i, j] = np.linalg.norm(vertices[i] - vertices[j])
                distances[j, i] = distances[i, j]
        return distances
    
    def _get_edge_pairs(self, vertices):
        """
        Get all the pairs of vertices that form an edge in the polyhedron
        """
        distances = self._get_all_distances(vertices)
        edge_pairs = []
        # Determine the number of neighbors for each vertex based on the edge count and number of vertices
        neighbors = (2 * self.n_edges) // self.n_vertices
        for i in range(self.n_vertices):
            # Get the indices of the closest neighbors
            closest_indices = np.argsort(distances[i])[1:neighbors+1]
            for j in closest_indices:
                # Ensure the edge pair is unique
                if (i, j) not in edge_pairs and (j, i) not in edge_pairs:
                    edge_pairs.append((i, j))

        return edge_pairs
    
    def _compute_gravity(self, vertices):
        """
        Compute the gravitational force acting on each vertex based on the distance to all other vertice.
        """
        euclidean_vertices = self._project_to_sphere(vertices)
        forces = np.zeros_like(vertices)
        for i in range(self.n_vertices):
            for j in range(self.n_vertices):
                if i != j:
                    diff = euclidean_vertices[j] - euclidean_vertices[i]
                    forces[i] += diff / np.linalg.norm(diff) ** 3
        return forces
    
    def _compute_pairwise_angles(self, vertices):
        """
        Computes pairwise angles between points in n-dimensional space.

        Args:
            vertices (numpy.ndarray): Array of shape (n_vertices, n_dimensions).

        Returns:
            tuple: (angles, pairs), where:
                - angles is a 1D array of pairwise angles.
                - pairs is a list of vertex index pairs.
        """
        pairs = self._get_edge_pairs(vertices)
        # Each vertex is in Cartesian coordinates, so we need to convert to spherical coordinates
        vertices = self._project_to_sphere(vertices)
        angles = []
        # Calculate the angle between each pair of vertices, with the center as the origin
        for pair in pairs:
            vertex1 = vertices[pair[0]]
            vertex2 = vertices[pair[1]]
            angle = np.arccos(np.dot(vertex1, vertex2))
            angles.append(angle)
        return np.array(angles), pairs
    
    def _compute_pairwise_distances(self, vertices):
        """
        Computes pairwise distances between points in n-dimensional space.

        Args:
            vertices (numpy.ndarray): Array of shape (n_vertices, n_dimensions).

        Returns:
            numpy.ndarray: Pairwise distances between vertices.
        """
        pairs = self._get_edge_pairs(vertices)
        # Each vertex is in Cartesian coordinates, so we need to convert to spherical coordinates
        vertices = self._project_to_sphere(vertices)
        distances = []
        # Calculate the distance between each pair of vertices
        for pair in pairs:
            vertex1 = vertices[pair[0]]
            vertex2 = vertices[pair[1]]
            distance = np.linalg.norm(vertex1 - vertex2)
            distances.append(distance)
        return np.array(distances)
    
    def _combined_loss(self, tammes_vertices, thomson_vertices):
        """
        Computes a unified loss function for Tammes and Thomson points in Cartesian coordinates.

        Args:
            tammes_vertices (numpy.ndarray): Array of shape (n_vertices, n_dimensions), points satisfying Tammes constraints.
            thomson_vertices (numpy.ndarray): Array of shape (n_vertices, n_dimensions), points satisfying Thomson constraints.

        Returns:
            float: The combined loss value.
        """
        # Normalize both sets of points to lie on the n-sphere
        tammes_vertices = self._project_to_sphere(tammes_vertices)
        thomson_vertices = self._project_to_sphere(thomson_vertices)

        # Compute Tammes loss
        tammes_angles, _ = self._compute_pairwise_angles(tammes_vertices)
        min_tammes_angle = np.min(tammes_angles)
        target_angle = np.arccos(-1 / (len(tammes_vertices) - 1))
        tames_gravity = self._compute_gravity(tammes_vertices)
        tammes_loss = -min_tammes_angle + (min_tammes_angle - target_angle)**2 + np.std(tames_gravity)

        # Compute Thomson loss
        thomson_gravity = self._compute_gravity(thomson_vertices)
        thomson_loss = np.mean(thomson_gravity) + np.std(thomson_gravity)

        # Combined loss
        return tammes_loss + thomson_loss

    def optimize(self, learning_rate=0.01, iterations=1000, show_progress=True):
        """
        Optimizes both Tammes and Thomson configurations simultaneously.

        Args:
            learning_rate (float): Step size for gradient updates.
            iterations (int): Number of iterations for optimization.
            show_progress (bool): Whether to show a progress bar.

        Returns:
            float: Best score achieved during optimization.
        """
        if show_progress:
            print("Optimizing Tammes and Thomson configurations...")
        
        best_tammes_vertices = self.tammes_vertices.copy()
        best_thomson_vertices = self.thomson_vertices.copy()
        best_score = np.inf

        if show_progress:
            pbar = tqdm(range(iterations))
        else:
            pbar = range(iterations)

        for i in pbar:
            # Initialize gradient arrays
            gradients_tammes = np.zeros_like(self.tammes_vertices)
            gradients_thomson = np.zeros_like(self.thomson_vertices)
            epsilon = np.float64(1e-8)

            # Compute gradients
            for j in range(self.n_vertices):
                for k in range(self.n_dimensions):
                    # Perturb Tammes vertex
                    tammes_perturbed = self.tammes_vertices.copy()
                    tammes_perturbed[j, k] += epsilon
                    loss_plus = self._combined_loss(tammes_perturbed, self.thomson_vertices)

                    tammes_perturbed[j, k] -= 2 * epsilon
                    loss_minus = self._combined_loss(tammes_perturbed, self.thomson_vertices)

                    gradients_tammes[j, k] = (loss_plus - loss_minus) / (2 * epsilon)

                    # Perturb Thomson vertex
                    thomson_perturbed = self.thomson_vertices.copy()
                    thomson_perturbed[j, k] += epsilon
                    loss_plus = self._combined_loss(self.tammes_vertices, thomson_perturbed)

                    thomson_perturbed[j, k] -= 2 * epsilon
                    loss_minus = self._combined_loss(self.tammes_vertices, thomson_perturbed)

                    gradients_thomson[j, k] = (loss_plus - loss_minus) / (2 * epsilon)

            # Update vertices using gradient descent
            self.tammes_vertices -= learning_rate * gradients_tammes
            self.thomson_vertices -= learning_rate * gradients_thomson

            # Normalize vertices
            self.tammes_vertices = self._project_to_sphere(self.tammes_vertices)
            self.thomson_vertices = self._project_to_sphere(self.thomson_vertices)

            # Compute current loss
            current_score = self._combined_loss(self.tammes_vertices, self.thomson_vertices)

            # Update best solution
            if current_score < best_score:
                best_score = current_score
                best_tammes_vertices = self.tammes_vertices.copy()
                best_thomson_vertices = self.thomson_vertices.copy()

            # Update progress bar
            if show_progress:
                pbar.set_postfix({'Score': f"{current_score:.4f}"})

            # Adaptive learning rate
            if i % 100 == 0 and i > 0:
                learning_rate *= 0.95

        # Save best solutions
        self.tammes_vertices = best_tammes_vertices
        self.thomson_vertices = best_thomson_vertices

        return best_score
    
    def get_angle_statistics(self, vertices):
        """Compute comprehensive statistics about vertex angles"""
        angles, pairs = self._compute_pairwise_angles(vertices)
        print(f"Target total edges: {self.n_edges}")
        print(f"Target neighbors per vertex: {self.target_neighbors}")
        stats = {
            'mean': np.mean(angles),
            'std': np.std(angles),
            'min': np.min(angles),
            'max': np.max(angles),
            'angles': angles,
            'pairs': pairs
        }
        return stats
    
    def get_force_statistics(self, vertices):
        """
        For each point, calculate the total force vector based on the distance to all other points
        """
        forces = np.zeros_like(vertices)
        for i in range(self.n_vertices):
            for j in range(i + 1, self.n_vertices):
                diff = vertices[j] - vertices[i]
                forces[i] += diff / np.linalg.norm(diff) ** 3
        return forces

    def visualize(self, show_edges=True, title="Tammes and Thomson Polyhedra"):
        """Visualize both Tammes and Thomson polyhedra with comprehensive angle information"""
        tammes_vertices = self._project_to_sphere(self.tammes_vertices, 2)
        thomson_vertices = self._project_to_sphere(self.thomson_vertices, 1)
        
        if self.n_dimensions > 3:
            reducer = umap.UMAP(n_components=3)
            tammes_vertices = reducer.fit_transform(tammes_vertices)
            thomson_vertices = reducer.fit_transform(thomson_vertices)
        
        fig = plt.figure(figsize=(15, 10))
        ax1 = fig.add_subplot(121, projection='3d')
        ax2 = fig.add_subplot(122)
        
        # Plot center point
        ax1.scatter([self.center[0]], [self.center[1]], 
                    [self.center[2] if len(self.center) > 2 else 0],
                    c='r', marker='*', s=200)
        
        # Plot tammes vertices
        ax1.scatter(tammes_vertices[:, 0], tammes_vertices[:, 1], 
                    tammes_vertices[:, 2] if tammes_vertices.shape[1] > 2 else 0,
                    c='g', marker='o', s=100, alpha=0.7)
        
        # Plot thomson vertices
        ax1.scatter(thomson_vertices[:, 0], thomson_vertices[:, 1],
                    thomson_vertices[:, 2] if thomson_vertices.shape[1] > 2 else 0,
                    c='b', marker='^', s=100, alpha=0.7)
        
        # Draw radius guidelines for Tammes vertices
        for vertex in tammes_vertices:
            ax1.plot([self.center[0], vertex[0]],
                    [self.center[1], vertex[1]],
                    [self.center[2] if len(self.center) > 2 else 0,
                        vertex[2] if vertex.shape[0] > 2 else 0],
                    'g--', alpha=0.2)
            
        # Draw radius guidelines for Thomson vertices
        for vertex in thomson_vertices:
            ax1.plot([self.center[0], vertex[0]],
                    [self.center[1], vertex[1]],
                    [self.center[2] if len(self.center) > 2 else 0,
                        vertex[2] if vertex.shape[0] > 2 else 0],
                    'b--', alpha=0.2)

        # Get edge pairs for Tammes vertices
        _, tammes_pairs = self._compute_pairwise_angles(tammes_vertices)
        tammes_stats = self.get_angle_statistics(vertices=tammes_vertices)
        tammes_forces = self.get_force_statistics(vertices=tammes_vertices)
        tammes_forces_std = np.std(tammes_forces, axis=0)
        tammes_forces_mean = np.mean(tammes_forces, axis=0)

        # Get edge pairs for Thomson vertices
        _, thomson_pairs = self._compute_pairwise_angles(thomson_vertices)
        thomson_stats = self.get_angle_statistics(vertices=thomson_vertices)
        thomson_forces = self.get_force_statistics(vertices=thomson_vertices)
        thomson_forces_std = np.std(thomson_forces, axis=0)
        thomson_forces_mean = np.mean(thomson_forces, axis=0)

        # Graph lines between edge pairs for Tammes vertices
        if show_edges:
            for pair in tammes_pairs:
                vertex1 = tammes_vertices[pair[0]]
                vertex2 = tammes_vertices[pair[1]]
                ax1.plot([vertex1[0], vertex2[0]],
                        [vertex1[1], vertex2[1]],
                        [vertex1[2] if vertex1.shape[0] > 2 else 0,
                            vertex2[2] if vertex2.shape[0] > 2 else 0],
                        'g-', alpha=0.5)
                
        # Graph lines between edge pairs for Thomson vertices
        if show_edges:
            for pair in thomson_pairs:
                vertex1 = thomson_vertices[pair[0]]
                vertex2 = thomson_vertices[pair[1]]
                ax1.plot([vertex1[0], vertex2[0]],
                        [vertex1[1], vertex2[1]],
                        [vertex1[2] if vertex1.shape[0] > 2 else 0,
                            vertex2[2] if vertex2.shape[0] > 2 else 0],
                        'b-', alpha=0.5)
        
        ax1.legend()
        ax1.set_title(title)

        # Add statistical information
        info_text = (
            f"Tammes Configuration:\n"
            f"    Angle Statistics (degrees):\n"
            f"        Mean: {np.degrees(tammes_stats['mean']):.4f}\n"
            f"        Std: {np.degrees(tammes_stats['std']):.4f}\n"
            f"        Min: {np.degrees(tammes_stats['min']):.4f}\n"
            f"        Max: {np.degrees(tammes_stats['max']):.4f}\n"
            f"    Force Statistics:\n"
            f"        Mean: {tammes_forces_mean}\n"
            f"        Std: {tammes_forces_std}\n"
            f"\n"
            f"Thomson Configuration:\n"
            f"    Angle Statistics (degrees):\n"
            f"        Mean: {np.degrees(thomson_stats['mean']):.4f}\n"
            f"        Std: {np.degrees(thomson_stats['std']):.4f}\n"
            f"        Min: {np.degrees(thomson_stats['min']):.4f}\n"
            f"        Max: {np.degrees(thomson_stats['max']):.4f}\n"
            f"    Force Statistics:\n"
            f"        Mean: {thomson_forces_mean}\n"
            f"        Std: {thomson_forces_std}\n"
        )
        ax2.text(0.05, 0.95, info_text,
                transform=ax2.transAxes,
                bbox=dict(facecolor='white', alpha=0.8),
                verticalalignment='top')
        ax2.axis('off')
        
        plt.tight_layout()        
        plt.show()
        
        return {'tammes': tammes_stats, 'thomson': thomson_stats}

# Example usage
if __name__ == "__main__":
    # Create a 3D polyhedron with 12 vertices
    poly = PolyhedronGenerator(n_dimensions=3, n_vertices=12, radius=1.0)
    
    poly.optimize(show_progress=True)
    
    poly.visualize()
